/**
 * Classifier Barrel Export — HairMatch
 */

export { createClassifier, resetClassifier, classifyFaceShape } from './classifier';
export { createRulesClassifier } from './rules-classifier';
export { createOnnxClassifier } from './onnx-classifier';
export type {
  FaceClassifier,
  ClassifierType,
  ClassificationResult,
} from './classifier.types';
