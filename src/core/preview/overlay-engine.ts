/**
 * Overlay Engine — HairMatch (B4-02)
 *
 * Computes the affine transform (position, scale, rotation) needed
 * to anchor a hair PNG overlay onto a face photo using MediaPipe
 * forehead and temple landmarks.
 *
 * Coordinate system: pixel space of the source image.
 */

import type { NormalizedLandmark } from '../face-detection/face-detection.types';
import * as LM from '../face-detection/landmark-indices';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverlayTransform {
  /** Canvas x anchor (top-center of overlay, aligned to forehead). */
  anchorX: number;
  /** Canvas y anchor (top of overlay). */
  anchorY: number;
  /** Draw width in pixels. */
  width: number;
  /** Draw height in pixels (preserves aspect ratio). */
  height: number;
  /** Head tilt angle in radians (rotation around anchor). */
  angle: number;
  /** CSS opacity for the blend slider. */
  opacity: number;
}

export interface HairOverlayAsset {
  /** Style ID matching styles-db.ts */
  styleId: string;
  /** Public path to the transparent PNG */
  src: string;
  /**
   * Natural width/height ratio of the PNG asset.
   * Used to compute height from the computed width.
   */
  aspectRatio: number;
  /**
   * Horizontal scale multiplier applied to the temple-to-temple width.
   * >1 = wider (e.g. voluminous curls), <1 = narrower.
   */
  widthScale: number;
  /**
   * Vertical offset from the forehead anchor, as a fraction of hair width.
   * Negative = moves hair up (above forehead), positive = down.
   */
  verticalOffset: number;
}

// ---------------------------------------------------------------------------
// Asset registry
// ---------------------------------------------------------------------------

/** Map from style ID → overlay asset metadata. */
export const HAIR_OVERLAY_ASSETS: Record<string, HairOverlayAsset> = {
  'classic-layers': {
    styleId: 'classic-layers',
    src: '/assets/hair-overlays/classic-layers.png',
    aspectRatio: 1.0,
    widthScale: 1.35,
    verticalOffset: -0.38,
  },
  'blunt-bob': {
    styleId: 'blunt-bob',
    src: '/assets/hair-overlays/blunt-bob.png',
    aspectRatio: 0.9,
    widthScale: 1.3,
    verticalOffset: -0.35,
  },
  'wolf-cut': {
    styleId: 'wolf-cut',
    src: '/assets/hair-overlays/wolf-cut.png',
    aspectRatio: 1.1,
    widthScale: 1.4,
    verticalOffset: -0.4,
  },
  'soft-waves': {
    styleId: 'soft-waves',
    src: '/assets/hair-overlays/soft-waves.png',
    aspectRatio: 1.15,
    widthScale: 1.45,
    verticalOffset: -0.42,
  },
  'textured-crop': {
    styleId: 'textured-crop',
    src: '/assets/hair-overlays/textured-crop.png',
    aspectRatio: 0.75,
    widthScale: 1.25,
    verticalOffset: -0.3,
  },
};

/** Styles with no overlay asset fall back to this placeholder. */
export const FALLBACK_OVERLAY: HairOverlayAsset = {
  styleId: '__fallback__',
  src: '',
  aspectRatio: 1.0,
  widthScale: 1.35,
  verticalOffset: -0.38,
};

// ---------------------------------------------------------------------------
// Transform computation
// ---------------------------------------------------------------------------

/**
 * Compute the canvas transform for a hair overlay given face landmarks.
 *
 * @param landmarks  - 468 normalized MediaPipe landmarks (x,y in [0,1]).
 * @param imageWidth  - Pixel width of the source image.
 * @param imageHeight - Pixel height of the source image.
 * @param asset       - Hair overlay asset metadata.
 * @param opacity     - Blend opacity 0–1.
 * @returns OverlayTransform ready for canvas rendering.
 */
export function computeOverlayTransform(
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number,
  asset: HairOverlayAsset,
  opacity = 0.9
): OverlayTransform {
  // Convert normalized → pixel coordinates
  const px = (lm: NormalizedLandmark) => ({
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
  });

  const leftTemple = px(landmarks[LM.LEFT_TEMPLE]);
  const rightTemple = px(landmarks[LM.RIGHT_TEMPLE]);
  const forehead = px(landmarks[LM.FOREHEAD_CENTER]);

  // Head tilt angle from left→right temple vector
  const dx = rightTemple.x - leftTemple.x;
  const dy = rightTemple.y - leftTemple.y;
  const angle = Math.atan2(dy, dx);

  // Temple-to-temple pixel distance → hair width
  const templeSpan = Math.sqrt(dx * dx + dy * dy);
  const hairWidth = templeSpan * asset.widthScale;
  const hairHeight = hairWidth * asset.aspectRatio;

  // Anchor at forehead center, offset upward
  const vertOffset = hairWidth * asset.verticalOffset;

  // Apply vertical offset in the rotated frame (along the up-vector of the head)
  const upAngle = angle - Math.PI / 2; // perpendicular to temple line
  const anchorX = forehead.x + Math.cos(upAngle) * vertOffset;
  const anchorY = forehead.y + Math.sin(upAngle) * vertOffset;

  return {
    anchorX,
    anchorY,
    width: hairWidth,
    height: hairHeight,
    angle,
    opacity,
  };
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------

/**
 * Draw a hair overlay onto a canvas context.
 *
 * Renders the source image first, then blends the hair PNG on top
 * using the computed affine transform.
 *
 * @param ctx         - 2D canvas rendering context.
 * @param sourceImage - The user's photo (HTMLImageElement or ImageBitmap).
 * @param hairImage   - The preloaded hair overlay PNG.
 * @param transform   - Transform from computeOverlayTransform().
 */
export function drawHairOverlay(
  ctx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement | ImageBitmap,
  hairImage: HTMLImageElement,
  transform: OverlayTransform
): void {
  const { anchorX, anchorY, width, height, angle, opacity } = transform;

  // 1. Draw the photo
  ctx.drawImage(sourceImage, 0, 0, ctx.canvas.width, ctx.canvas.height);

  // 2. Draw the hair overlay
  ctx.save();
  ctx.globalAlpha = opacity;

  // Translate to anchor point, rotate, then draw centered on anchor
  ctx.translate(anchorX, anchorY);
  ctx.rotate(angle);

  // Draw with top-center at origin (hair hangs down from forehead)
  ctx.drawImage(hairImage, -width / 2, 0, width, height);

  ctx.restore();
}
