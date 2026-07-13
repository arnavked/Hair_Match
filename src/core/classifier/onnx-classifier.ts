/**
 * ONNX Face Shape Classifier — HairMatch (B2-05)
 *
 * Loads and runs an ONNX model for face shape classification
 * using onnxruntime-web with WASM backend.
 *
 * Input:  18-element Float32Array (geometric features)
 * Output: 5-class softmax probabilities (FaceShapeScores)
 */

import type { FaceShape, FaceShapeScores } from '../../types';
import { FACE_SHAPES } from '../../types';
import type { GeometricFeatures } from '../feature-extraction/feature-extractor.types';
import { NUM_FEATURES } from '../feature-extraction/feature-extractor.types';
import type { FaceClassifier } from './classifier.types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Path to the ONNX model file (placed in public/models/). */
const MODEL_PATH = '/models/face_shape_classifier.onnx';

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

class OnnxClassifierImpl implements FaceClassifier {
  readonly type = 'onnx' as const;
  private session: import('onnxruntime-web').InferenceSession | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.session) return;

    // Dynamic import so onnxruntime-web is only loaded when needed
    const ort = await import('onnxruntime-web');

    this.session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });

    this.initialized = true;
  }

  async classify(features: GeometricFeatures): Promise<FaceShapeScores> {
    if (!this.session || !this.initialized) {
      throw new Error('ONNX classifier not initialized. Call initialize() first.');
    }

    const ort = await import('onnxruntime-web');

    // Create input tensor: [1, 18] float32
    const inputTensor = new ort.Tensor(
      'float32',
      features.values,
      [1, NUM_FEATURES]
    );

    // Run inference
    const inputName = this.session.inputNames[0];
    const feeds: Record<string, import('onnxruntime-web').Tensor> = {
      [inputName]: inputTensor,
    };
    const results = await this.session.run(feeds);

    // Get output — may be raw logits or probabilities
    const outputName = this.session.outputNames[0];
    const output = results[outputName];
    const data = output.data as Float32Array;

    // If model outputs 5 values, map to face shapes
    // Apply softmax if needed (in case model outputs raw logits)
    const probabilities = applySoftmaxIfNeeded(data);

    const scores: Partial<FaceShapeScores> = {};
    FACE_SHAPES.forEach((shape: FaceShape, i: number) => {
      scores[shape] = probabilities[i] ?? 0;
    });

    return scores as FaceShapeScores;
  }

  isReady(): boolean {
    return this.initialized && this.session !== null;
  }

  dispose(): void {
    // onnxruntime-web InferenceSession doesn't have a close/dispose in all versions
    this.session = null;
    this.initialized = false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply softmax if the output doesn't already look like probabilities.
 * (If values don't sum to ~1.0, apply softmax.)
 */
function applySoftmaxIfNeeded(data: Float32Array): Float32Array {
  const sum = data.reduce((a, b) => a + b, 0);

  // If already close to 1.0 and all non-negative, it's already softmaxed
  if (Math.abs(sum - 1.0) < 0.05 && data.every((v) => v >= 0)) {
    return data;
  }

  // Apply softmax
  const maxVal = Math.max(...Array.from(data));
  const exps = data.map((v) => Math.exp(v - maxVal));
  const expSum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / expSum) as unknown as Float32Array;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Create an ONNX-based classifier. Must call initialize() before use. */
export function createOnnxClassifier(): OnnxClassifierImpl {
  return new OnnxClassifierImpl();
}
