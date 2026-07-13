/**
 * Camera Capture Module — HairMatch (B1-06)
 *
 * Browser camera capture using getUserMedia.
 * Selects front-facing camera by default on mobile.
 * Gracefully handles desktops without cameras.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CameraConfig {
  /** Preferred facing mode. Defaults to 'user' (front-facing). */
  facingMode?: 'user' | 'environment';
  /** Ideal video width. Defaults to 1280. */
  idealWidth?: number;
  /** Ideal video height. Defaults to 720. */
  idealHeight?: number;
}

const DEFAULT_CONFIG: CameraConfig = {
  facingMode: 'user',
  idealWidth: 1280,
  idealHeight: 720,
};

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

/**
 * Check if the browser supports camera capture via getUserMedia.
 * Returns false on desktop browsers without camera, or older browsers.
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

// ---------------------------------------------------------------------------
// Camera control
// ---------------------------------------------------------------------------

/**
 * Start the camera and attach the stream to a video element.
 *
 * @param videoElement - The <video> element to attach the stream to.
 * @param config - Optional camera configuration.
 * @returns The MediaStream, or null if the camera is unavailable.
 * @throws Error if camera access is denied by the user.
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  config: CameraConfig = DEFAULT_CONFIG
): Promise<MediaStream | null> {
  if (!isCameraSupported()) {
    return null;
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: mergedConfig.facingMode,
        width: { ideal: mergedConfig.idealWidth },
        height: { ideal: mergedConfig.idealHeight },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('muted', '');
    videoElement.muted = true;

    // Wait for the video to be ready
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(resolve).catch(reject);
      };
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Camera stream timeout')), 5000);
    });

    return stream;
  } catch (error) {
    // Re-throw permission denied errors with a clear message
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new Error('Camera access denied by user');
    }
    // NotFoundError means no camera — return null (graceful fallback)
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }
    // OverconstrainedError — try without facing mode constraint
    if (error instanceof DOMException && error.name === 'OverconstrainedError') {
      return startCamera(videoElement, { ...config, facingMode: undefined });
    }
    throw error;
  }
}

/**
 * Capture the current video frame as an ImageBitmap.
 *
 * @param videoElement - The <video> element currently showing the camera feed.
 * @returns An ImageBitmap of the current frame.
 */
export async function captureFrame(
  videoElement: HTMLVideoElement
): Promise<ImageBitmap> {
  if (videoElement.readyState < 2) {
    throw new Error('Video element is not ready for capture');
  }

  // Create a canvas to extract the frame
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  ctx.drawImage(videoElement, 0, 0);

  // Convert to ImageBitmap for MediaPipe consumption
  return createImageBitmap(canvas);
}

/**
 * Stop all tracks on a media stream and detach from the video element.
 *
 * @param stream - The MediaStream to stop.
 * @param videoElement - Optional video element to detach.
 */
export function stopCamera(
  stream: MediaStream,
  videoElement?: HTMLVideoElement
): void {
  stream.getTracks().forEach((track) => track.stop());

  if (videoElement) {
    videoElement.srcObject = null;
  }
}
