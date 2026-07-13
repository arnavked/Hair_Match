/**
 * Face Detection Barrel Export — HairMatch
 */

export { createFaceLandmarkerService } from './face-detection';
export type {
  FaceDetectionResult,
  FaceLandmarkerService,
  NormalizedLandmark,
  BoundingBox,
  FaceDetectionStatus,
  FaceDetectionError,
} from './face-detection.types';
export * from './landmark-indices';
