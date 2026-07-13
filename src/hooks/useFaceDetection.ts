/**
 * useFaceDetection Hook — HairMatch
 *
 * React hook wrapping the FaceLandmarkerService for use in components.
 * Manages initialization state, detection lifecycle, and cleanup.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createFaceLandmarkerService } from '@/core/face-detection/face-detection';
import type {
  FaceDetectionResult,
  FaceLandmarkerService,
  FaceDetectionStatus,
  FaceDetectionError,
} from '@/core/face-detection/face-detection.types';

interface UseFaceDetectionReturn {
  /** Detect faces in an image. Initializes the service if needed. */
  detect: (
    image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
  ) => Promise<FaceDetectionResult[]>;

  /** Current status of the face detection service. */
  status: FaceDetectionStatus;

  /** Whether the service is fully initialized and ready. */
  isReady: boolean;

  /** Whether the service is currently loading/initializing. */
  isLoading: boolean;

  /** Error details if initialization or detection failed. */
  error: FaceDetectionError | null;

  /** Explicitly initialize the service (auto-called by detect if needed). */
  initialize: () => Promise<void>;
}

/**
 * Hook for face detection using MediaPipe Face Landmarker.
 *
 * @example
 * ```tsx
 * const { detect, isReady, isLoading, error } = useFaceDetection();
 *
 * const handleUpload = async (imageBitmap: ImageBitmap) => {
 *   const results = await detect(imageBitmap);
 *   // results[0].landmarks contains 468 NormalizedLandmark objects
 * };
 * ```
 */
export function useFaceDetection(): UseFaceDetectionReturn {
  const [status, setStatus] = useState<FaceDetectionStatus>('idle');
  const [error, setError] = useState<FaceDetectionError | null>(null);
  const serviceRef = useRef<FaceLandmarkerService | null>(null);

  // Get or create the singleton service
  const getService = useCallback((): FaceLandmarkerService => {
    if (!serviceRef.current) {
      serviceRef.current = createFaceLandmarkerService();
    }
    return serviceRef.current;
  }, []);

  // Initialize the service
  const initialize = useCallback(async (): Promise<void> => {
    const service = getService();

    if (service.isReady()) {
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await service.initialize();
      setStatus('ready');
    } catch (err) {
      const detectionError: FaceDetectionError = {
        code: 'MODEL_LOAD_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to initialize face detection',
        cause: err,
      };
      setError(detectionError);
      setStatus('error');
      throw err;
    }
  }, [getService]);

  // Detect faces in an image
  const detect = useCallback(
    async (
      image: ImageBitmap | HTMLImageElement | HTMLCanvasElement
    ): Promise<FaceDetectionResult[]> => {
      const service = getService();

      // Auto-initialize if not ready
      if (!service.isReady()) {
        await initialize();
      }

      try {
        return await service.detect(image);
      } catch (err) {
        const detectionError: FaceDetectionError = {
          code: 'DETECTION_FAILED',
          message:
            err instanceof Error
              ? err.message
              : 'Face detection failed',
          cause: err,
        };
        setError(detectionError);
        throw err;
      }
    },
    [getService, initialize]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose the singleton — other components might still need it.
      // The singleton self-manages its lifecycle.
      serviceRef.current = null;
    };
  }, []);

  return {
    detect,
    status,
    isReady: status === 'ready',
    isLoading: status === 'loading',
    error,
    initialize,
  };
}
