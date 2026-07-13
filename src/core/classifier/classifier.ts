/**
 * Unified Classifier Factory — HairMatch (B2)
 *
 * Creates the best available classifier:
 * 1. Tries to load the ONNX ML model
 * 2. Falls back to rules-based classifier if ONNX fails
 *
 * Also provides a helper to run full classification (features → scores → result).
 */

import type { FaceShape, FaceShapeScores } from '../../types';
import { FACE_SHAPES } from '../../types';
import type { GeometricFeatures } from '../feature-extraction/feature-extractor.types';
import type { FaceClassifier, ClassificationResult } from './classifier.types';
import { createRulesClassifier } from './rules-classifier';
import { createOnnxClassifier } from './onnx-classifier';

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let singletonClassifier: FaceClassifier | null = null;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the best available classifier.
 * Tries ONNX first, falls back to rules-based.
 *
 * The result is cached as a singleton — subsequent calls return
 * the same instance.
 */
export async function createClassifier(): Promise<FaceClassifier> {
  if (singletonClassifier) {
    return singletonClassifier;
  }

  // Try ONNX first
  try {
    const onnx = createOnnxClassifier();
    await onnx.initialize();
    singletonClassifier = onnx;
    console.info('[HairMatch] ONNX classifier loaded successfully');
    return onnx;
  } catch (_err) {
    // ONNX model not available — fall back to rules
    console.info('[HairMatch] ONNX model not available, using rules-based classifier');
  }

  // Fallback: rules-based classifier
  const rules = createRulesClassifier();
  singletonClassifier = rules;
  return rules;
}

/**
 * Reset the singleton (for testing or when switching models).
 */
export function resetClassifier(): void {
  if (singletonClassifier) {
    singletonClassifier.dispose();
    singletonClassifier = null;
  }
}

// ---------------------------------------------------------------------------
// Classification helper
// ---------------------------------------------------------------------------

/**
 * Run full classification: features → scores → result with metadata.
 *
 * @param features - 18-element geometric feature vector.
 * @param classifier - Optional pre-created classifier (defaults to singleton).
 * @returns ClassificationResult with scores, dominant shape, confidence, and timing.
 */
export async function classifyFaceShape(
  features: GeometricFeatures,
  classifier?: FaceClassifier
): Promise<ClassificationResult> {
  const cls = classifier ?? await createClassifier();

  const startTime = performance.now();
  const scores = await cls.classify(features);
  const inferenceTimeMs = performance.now() - startTime;

  // Find dominant shape
  const { dominantShape, confidence } = findDominantShape(scores);

  return {
    scores,
    dominantShape,
    confidence,
    classifierType: cls.type,
    inferenceTimeMs,
  };
}

/**
 * Find the face shape with the highest confidence score.
 */
function findDominantShape(scores: FaceShapeScores): {
  dominantShape: FaceShape;
  confidence: number;
} {
  let dominantShape: FaceShape = 'oval';
  let maxScore = -Infinity;

  for (const shape of FACE_SHAPES) {
    if (scores[shape] > maxScore) {
      maxScore = scores[shape];
      dominantShape = shape;
    }
  }

  return { dominantShape, confidence: maxScore };
}
