/**
 * Face Detection Service — HairMatch (B1-01)
 *
 * Singleton service wrapping MediaPipe Face Landmarker for detecting
 * 468 facial landmarks on a static image. Runs entirely client-side
 * using WASM + WebGL.
 *
 * Usage:
 *   const service = createFaceLandmarkerService();
 *   await service.initialize();
 *   const results = await service.detect(imageBitmap);
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type {
  FaceDetectionResult,
  FaceLandmarkerService,
  NormalizedLandmark,
  BoundingBox,
} from './face-detection.types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Path to self-hosted MediaPipe WASM files.
 * These are copied to public/mediapipe/ during build setup.
 */
const WASM_FILES_PATH = '/mediapipe/wasm';

/**
 * Path to the Face Landmarker model file (float16 variant for smaller size).
 */
const MODEL_PATH = '/mediapipe/face_landmarker.task';

/**
 * Maximum number of faces to detect.
 * We detect up to 5 so we can report MULTIPLE_FACES in validation,
 * but we only process the first face for recommendations.
 */
const MAX_FACES = 5;

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let singletonInstance: FaceLandmarkerServiceImpl | null = null;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

class FaceLandmarkerServiceImpl implements FaceLandmarkerService {
  private landmarker: FaceLandmarker | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.landmarker) {
      return;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_FILES_PATH);

      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: 'GPU', // WebGL delegate for performance
        },
        runningMode: 'IMAGE',
        numFaces: MAX_FACES,
        outputFaceBlendshapes: false, // Not needed for shape classification
        outputFacialTransformationMatrixes: false,
      });

      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      this.landmarker = null;
      throw new Error(
        `Failed to initialize Face Landmarker: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async detect(
    image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult[]> {
    if (!this.landmarker || !this.initialized) {
      throw new Error(
        'FaceLandmarkerService not initialized. Call initialize() first.'
      );
    }

    const startTime = performance.now();

    const result = this.landmarker.detect(image);
    const processingTimeMs = performance.now() - startTime;

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      return [];
    }

    const faceCount = result.faceLandmarks.length;

    return result.faceLandmarks.map((faceLandmarks) => {
      const landmarks: NormalizedLandmark[] = faceLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? undefined,
      }));

      const boundingBox = computeBoundingBox(landmarks);

      return {
        landmarks,
        faceCount,
        boundingBox,
        processingTimeMs,
      };
    });
  }

  isReady(): boolean {
    return this.initialized && this.landmarker !== null;
  }

  dispose(): void {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.initialized = false;
    singletonInstance = null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute an axis-aligned bounding box from normalized landmarks.
 */
function computeBoundingBox(landmarks: NormalizedLandmark[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ---------------------------------------------------------------------------
// Factory / Singleton
// ---------------------------------------------------------------------------

/**
 * Get the singleton FaceLandmarkerService instance.
 * Multiple calls return the same instance.
 */
export function createFaceLandmarkerService(): FaceLandmarkerService {
  if (!singletonInstance) {
    singletonInstance = new FaceLandmarkerServiceImpl();
  }
  return singletonInstance;
}

// Re-export types for convenience
export type {
  FaceDetectionResult,
  FaceLandmarkerService,
  NormalizedLandmark,
  BoundingBox,
} from './face-detection.types';
