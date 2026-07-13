/**
 * LandmarkOverlay — HairMatch (B1-05)
 *
 * Debug component that renders all 468 facial landmarks as colored
 * dots on a canvas overlaid on the user's photo.
 *
 * Key landmarks (forehead, temples, jaw, etc.) are highlighted in
 * a different color for easy identification.
 *
 * ONLY rendered in development mode — stripped from production builds
 * by Vite's tree-shaking (import.meta.env.DEV).
 */

import { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@/core/face-detection/face-detection.types';
import { KEY_LANDMARKS } from '@/core/face-detection/landmark-indices';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LandmarkOverlayProps {
  /** Array of 468 normalized landmarks to render. */
  landmarks: NormalizedLandmark[];
  /** Width of the source image in pixels. */
  imageWidth: number;
  /** Height of the source image in pixels. */
  imageHeight: number;
  /** Only show key landmarks (forehead, temples, jaw, etc.). */
  showKeyLandmarksOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color for regular landmarks. */
const REGULAR_COLOR = 'rgba(0, 255, 255, 0.6)'; // Cyan

/** Color for key landmarks (forehead, temples, jaw, etc.). */
const KEY_COLOR = 'rgba(255, 50, 50, 0.9)'; // Red

/** Radius for regular landmark dots (px). */
const REGULAR_RADIUS = 1.5;

/** Radius for key landmark dots (px). */
const KEY_RADIUS = 3;

/** Set of key landmark indices for O(1) lookup. */
const KEY_LANDMARK_SET = new Set<number>(KEY_LANDMARKS);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Development-only debug overlay that visualizes facial landmarks.
 * Returns null in production builds.
 */
export function LandmarkOverlay({
  landmarks,
  imageWidth,
  imageHeight,
  showKeyLandmarksOnly = false,
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only render in development mode
    if (!import.meta.env.DEV) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous render
    ctx.clearRect(0, 0, imageWidth, imageHeight);

    // Draw each landmark
    landmarks.forEach((landmark, index) => {
      const isKey = KEY_LANDMARK_SET.has(index);

      // Skip non-key landmarks if showKeyLandmarksOnly is true
      if (showKeyLandmarksOnly && !isKey) return;

      const x = landmark.x * imageWidth;
      const y = landmark.y * imageHeight;

      ctx.beginPath();
      ctx.arc(
        x,
        y,
        isKey ? KEY_RADIUS : REGULAR_RADIUS,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = isKey ? KEY_COLOR : REGULAR_COLOR;
      ctx.fill();

      // Label key landmarks with their index number
      if (isKey) {
        ctx.font = '10px monospace';
        ctx.fillStyle = KEY_COLOR;
        ctx.fillText(String(index), x + KEY_RADIUS + 2, y - KEY_RADIUS);
      }
    });
  }, [landmarks, imageWidth, imageHeight, showKeyLandmarksOnly]);

  // Don't render in production
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      aria-hidden="true"
      data-testid="landmark-overlay"
    />
  );
}
