/**
 * useCamera Hook — HairMatch (B1-06)
 *
 * React hook wrapping camera capture functionality.
 * Manages camera lifecycle, video element ref, and cleanup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  startCamera,
  captureFrame,
  stopCamera,
  isCameraSupported,
} from '@/core/camera/camera-capture';
import type { CameraConfig } from '@/core/camera/camera-capture';

interface UseCameraReturn {
  /** Ref to attach to a <video> element. */
  videoRef: React.RefObject<HTMLVideoElement>;

  /** Start the camera stream. */
  start: (config?: CameraConfig) => Promise<void>;

  /** Capture the current video frame as an ImageBitmap. */
  capture: () => Promise<ImageBitmap>;

  /** Stop the camera and release resources. */
  stop: () => void;

  /** Whether the camera stream is currently active. */
  isActive: boolean;

  /** Whether the device has a camera available. */
  hasCamera: boolean;

  /** Error message if camera access failed. */
  error: string | null;
}

/**
 * Hook for camera capture in the browser.
 *
 * @example
 * ```tsx
 * const { videoRef, start, capture, stop, isActive, hasCamera, error } = useCamera();
 *
 * return (
 *   <>
 *     <video ref={videoRef} />
 *     {hasCamera && <button onClick={start}>Start Camera</button>}
 *     {isActive && <button onClick={async () => {
 *       const frame = await capture();
 *       // Process frame...
 *     }}>Take Photo</button>}
 *   </>
 * );
 * ```
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check camera availability on mount
  useEffect(() => {
    setHasCamera(isCameraSupported());
  }, []);

  // Start camera
  const start = useCallback(async (config?: CameraConfig): Promise<void> => {
    if (!videoRef.current) {
      setError('Video element not available');
      return;
    }

    setError(null);

    try {
      const stream = await startCamera(videoRef.current, config);

      if (stream === null) {
        setHasCamera(false);
        setError(null); // No error, just no camera — show upload only
        return;
      }

      streamRef.current = stream;
      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start camera'
      );
      setIsActive(false);
    }
  }, []);

  // Capture frame
  const capture = useCallback(async (): Promise<ImageBitmap> => {
    if (!videoRef.current) {
      throw new Error('Video element not available');
    }
    if (!isActive) {
      throw new Error('Camera is not active');
    }

    return captureFrame(videoRef.current);
  }, [isActive]);

  // Stop camera
  const stop = useCallback((): void => {
    if (streamRef.current) {
      stopCamera(
        streamRef.current,
        videoRef.current ?? undefined
      );
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    start,
    capture,
    stop,
    isActive,
    hasCamera,
    error,
  };
}
