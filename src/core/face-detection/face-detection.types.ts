/**
 * Face Detection Types — HairMatch
 *
 * TypeScript interfaces for the face detection module.
 * Re-exports relevant MediaPipe types for downstream consumers.
 */

// ---------------------------------------------------------------------------
// Landmark type (mirrors MediaPipe NormalizedLandmark)
// ---------------------------------------------------------------------------

/**
 * A single normalized facial landmark.
 * Coordinates are normalized to [0, 1] relative to the image dimensions.
 */
export interface NormalizedLandmark {
  /** X coordinate, normalized [0, 1] by image width. */
  x: number;
  /** Y coordinate, normalized [0, 1] by image height. */
  y: number;
  /** Z depth, relative to face width (negative = closer to camera). */
  z: number;
  /** Visibility likelihood (0 to 1). May be undefined. */
  visibility?: number;
}

// ---------------------------------------------------------------------------
// Bounding box
// ---------------------------------------------------------------------------

/** Axis-aligned bounding box in normalized coordinates. */
export interface BoundingBox {
  /** Left edge, normalized [0, 1]. */
  x: number;
  /** Top edge, normalized [0, 1]. */
  y: number;
  /** Width, normalized [0, 1]. */
  width: number;
  /** Height, normalized [0, 1]. */
  height: number;
}

// ---------------------------------------------------------------------------
// Detection result
// ---------------------------------------------------------------------------

/** Result from a single face detection on an image. */
export interface FaceDetectionResult {
  /** Array of 468 normalized landmarks for this face. */
  landmarks: NormalizedLandmark[];
  /** Number of faces detected in the image. */
  faceCount: number;
  /** Bounding box of the detected face in normalized coordinates. */
  boundingBox: BoundingBox;
  /** Time taken for detection in milliseconds. */
  processingTimeMs: number;
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

/** The face landmarker service — singleton, lazy-initialized. */
export interface FaceLandmarkerService {
  /** Initialize the MediaPipe model. Must be called before detect(). */
  initialize(): Promise<void>;

  /**
   * Detect faces in a static image.
   * Returns one FaceDetectionResult per detected face.
   */
  detect(
    image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult[]>;

  /** Whether the service has been initialized and is ready for detection. */
  isReady(): boolean;

  /** Release all resources held by the service. */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Initialization state
// ---------------------------------------------------------------------------

/** Possible states of the face detection service. */
export type FaceDetectionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

/** Error info from the face detection service. */
export interface FaceDetectionError {
  code: 'MODEL_LOAD_FAILED' | 'DETECTION_FAILED' | 'BROWSER_UNSUPPORTED';
  message: string;
  cause?: unknown;
}
