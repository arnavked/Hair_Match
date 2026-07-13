/**
 * Rules-Based Face Shape Classifier — HairMatch (B2)
 *
 * Deterministic classifier using geometric heuristic rules.
 * Ships as the Alpha classifier and serves as fallback when the
 * ONNX ML model is unavailable.
 *
 * Classification logic based on PRD Section 5 face shape definitions:
 *
 * | Shape   | Key Characteristics                                              |
 * |---------|------------------------------------------------------------------|
 * | Oval    | height:width ≈ 1.5, balanced proportions, high circularity       |
 * | Round   | height:width ≈ 1.0, high circularity, full cheeks               |
 * | Square  | height:width ≈ 1.0, wide jaw ≈ forehead, angular jawline        |
 * | Heart   | forehead > jaw, narrow chin, wider upper face                    |
 * | Oblong  | height:width > 1.6, narrow proportions, elongated                |
 *
 * The classifier computes a raw "affinity score" for each shape and
 * then applies softmax to produce probabilities that sum to ~1.0.
 */

import type { FaceShape, FaceShapeScores } from '../../types';
import { FACE_SHAPES } from '../../types';
import type { GeometricFeatures } from '../feature-extraction/feature-extractor.types';
import type { FaceClassifier } from './classifier.types';

// ---------------------------------------------------------------------------
// Rules classifier implementation
// ---------------------------------------------------------------------------

class RulesClassifierImpl implements FaceClassifier {
  readonly type = 'rules' as const;

  async classify(features: GeometricFeatures): Promise<FaceShapeScores> {
    const f = features.named;
    const rawScores: Record<string, number> = {};

    // -------------------------------------------------------------------
    // Oval: balanced proportions, height/width ≈ 1.5, high circularity
    // -------------------------------------------------------------------
    rawScores['oval'] =
      gaussianScore(f.faceHeightToWidthRatio, 1.5, 0.15) * 2.0 +
      gaussianScore(f.foreheadToJawRatio, 1.05, 0.15) +
      gaussianScore(f.cheekboneWidthRatio, 0.95, 0.1) +
      clamp01(f.faceCircularity) * 0.8 +
      gaussianScore(f.foreheadToCheekRatio, 0.9, 0.15) * 0.5;

    // -------------------------------------------------------------------
    // Round: height/width ≈ 1.0, high circularity, full cheeks
    // -------------------------------------------------------------------
    rawScores['round'] =
      gaussianScore(f.faceHeightToWidthRatio, 1.0, 0.12) * 2.0 +
      clamp01(f.faceCircularity) * 1.5 +
      clamp01(f.cheekFullness * 10) * 1.2 +
      gaussianScore(f.foreheadToJawRatio, 1.0, 0.15) * 0.8 +
      gaussianScore(f.jawToCheekRatio, 0.95, 0.1) * 0.5;

    // -------------------------------------------------------------------
    // Square: height/width ≈ 1.0, jaw ≈ forehead, angular jaw
    // -------------------------------------------------------------------
    rawScores['square'] =
      gaussianScore(f.faceHeightToWidthRatio, 1.05, 0.12) * 1.5 +
      gaussianScore(f.foreheadToJawRatio, 1.0, 0.1) * 1.5 +
      gaussianScore(f.jawWidthRatio, 0.9, 0.1) * 1.2 +
      (1 - clamp01(f.faceCircularity)) * 1.0 + // lower circularity = more angular
      angleSharpnessScore(f.jawAngleLeft, f.jawAngleRight) * 1.0;

    // -------------------------------------------------------------------
    // Heart: forehead > jaw, narrow chin, wider upper face
    // -------------------------------------------------------------------
    rawScores['heart'] =
      sigmoidScore(f.foreheadToJawRatio, 1.2, 5.0) * 2.5 +
      sigmoidScore(f.templeToJawTaper, 0.1, 8.0) * 1.5 +
      (1 - clamp01(f.jawWidthRatio)) * 1.0 +
      gaussianScore(f.foreheadWidthRatio, 0.85, 0.1) * 0.8 +
      (1 - clamp01(f.chinToJawRatio * 3)) * 0.5;

    // -------------------------------------------------------------------
    // Oblong: height/width > 1.6, narrow proportions
    // -------------------------------------------------------------------
    rawScores['oblong'] =
      sigmoidScore(f.faceHeightToWidthRatio, 1.6, 5.0) * 2.5 +
      (1 - clamp01(f.faceCircularity)) * 1.0 +
      gaussianScore(f.foreheadToJawRatio, 1.0, 0.15) * 0.8 +
      sigmoidScore(f.lowerFaceHeight, 0.4, 5.0) * 0.7 +
      (1 - clamp01(f.cheekFullness * 10)) * 0.5;

    // -------------------------------------------------------------------
    // Apply softmax to convert raw scores to probabilities
    // -------------------------------------------------------------------
    return softmax(rawScores as unknown as Record<FaceShape, number>);
  }

  isReady(): boolean {
    return true; // Rules classifier is always ready
  }

  dispose(): void {
    // No-op — nothing to clean up
  }
}

// ---------------------------------------------------------------------------
// Scoring helper functions
// ---------------------------------------------------------------------------

/**
 * Gaussian score — peaks at `center`, falls off with `sigma`.
 * Returns a value in (0, 1].
 */
function gaussianScore(value: number, center: number, sigma: number): number {
  const diff = value - center;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

/**
 * Sigmoid score — smooth step function centered at `center`.
 * Returns value near 0 below center, near 1 above center.
 * `steepness` controls transition sharpness.
 */
function sigmoidScore(value: number, center: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (value - center)));
}

/**
 * Jaw angle sharpness score.
 * Sharper angles (lower radians) score higher.
 * Typical range: 1.8 (sharp/square) to 2.8 (smooth/round).
 */
function angleSharpnessScore(leftAngle: number, rightAngle: number): number {
  const avgAngle = (leftAngle + rightAngle) / 2;
  // Map: 1.8 rad → 1.0, 2.8 rad → 0.0
  return clamp01(1 - (avgAngle - 1.8) / 1.0);
}

/** Clamp a value to [0, 1]. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Softmax over a record of named scores.
 * Temperature is set to 1.0 (standard softmax).
 */
function softmax(scores: Record<FaceShape, number>): FaceShapeScores {
  // Find max for numerical stability
  const values = FACE_SHAPES.map((shape) => scores[shape] ?? 0);
  const maxVal = Math.max(...values);

  const exps = values.map((v) => Math.exp(v - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);

  const result: Partial<FaceShapeScores> = {};
  FACE_SHAPES.forEach((shape, i) => {
    result[shape] = exps[i] / sumExps;
  });

  return result as FaceShapeScores;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Create a rules-based face shape classifier. */
export function createRulesClassifier(): FaceClassifier {
  return new RulesClassifierImpl();
}
