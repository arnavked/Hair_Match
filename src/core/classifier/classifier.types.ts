/**
 * Classifier Types — HairMatch (B2)
 *
 * Shared interface for all face shape classifiers (rules-based, ONNX).
 */

import type { FaceShapeScores } from '../../types';
import type { GeometricFeatures } from '../feature-extraction/feature-extractor.types';

// ---------------------------------------------------------------------------
// Classifier interface
// ---------------------------------------------------------------------------

/** Classifier backend type. */
export type ClassifierType = 'rules' | 'onnx';

/**
 * Unified classifier interface.
 * Implemented by both the rules-based and ONNX classifiers.
 */
export interface FaceClassifier {
  /** Classify features into face shape scores. */
  classify(features: GeometricFeatures): Promise<FaceShapeScores>;

  /** Which backend is active. */
  readonly type: ClassifierType;

  /** Whether the classifier is ready for inference. */
  isReady(): boolean;

  /** Release resources (ONNX session, etc.). */
  dispose(): void;
}

/** Classification result with metadata. */
export interface ClassificationResult {
  /** Softmax-like scores for each face shape. */
  scores: FaceShapeScores;

  /** The dominant (highest-scoring) face shape. */
  dominantShape: import('../../types').FaceShape;

  /** Confidence of the dominant shape (0 to 1). */
  confidence: number;

  /** Which classifier backend produced the result. */
  classifierType: ClassifierType;

  /** Inference time in milliseconds. */
  inferenceTimeMs: number;
}
