/**
 * StylePreviewCanvas — HairMatch (B4-02)
 *
 * Full-screen modal that composites a hair overlay PNG onto the user's
 * photo using canvas, anchored by MediaPipe forehead + temple landmarks.
 *
 * Features:
 * - Renders user photo + hair overlay at full canvas resolution
 * - Opacity slider for blend control (30–100%)
 * - Previous / Next style navigation
 * - "Save Preview" — downloads the composited canvas as JPEG
 * - Keyboard: ArrowLeft / ArrowRight to switch styles, Escape to close
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { NormalizedLandmark } from '@/core/face-detection/face-detection.types';
import type { ScoredRecommendation } from '@/core/recommender';
import {
  computeOverlayTransform,
  drawHairOverlay,
  HAIR_OVERLAY_ASSETS,
  FALLBACK_OVERLAY,
} from '@/core/preview/overlay-engine';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StylePreviewCanvasProps {
  /** User's uploaded photo URL. */
  photoSrc: string;
  /** Width of the original photo in pixels. */
  photoWidth: number;
  /** Height of the original photo in pixels. */
  photoHeight: number;
  /** 468 MediaPipe landmarks from the detection pass. */
  landmarks: NormalizedLandmark[];
  /** Scored recommendations — the styles available to preview. */
  recommendations: ScoredRecommendation[];
  /** Index into recommendations to start on. */
  initialIndex?: number;
  /** Called when user closes the modal. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StylePreviewCanvas({
  photoSrc,
  photoWidth,
  photoHeight,
  landmarks,
  recommendations,
  initialIndex = 0,
  onClose,
}: StylePreviewCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [opacity, setOpacity] = useState(0.88);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Preloaded images
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const hairImgRef = useRef<HTMLImageElement | null>(null);
  const hairImgSrcRef = useRef<string>('');

  const currentStyle = recommendations[currentIndex]?.style;
  const asset = currentStyle
    ? HAIR_OVERLAY_ASSETS[currentStyle.id] ?? FALLBACK_OVERLAY
    : FALLBACK_OVERLAY;

  // ---------------------------------------------------------------------------
  // Load photo image once
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      photoImgRef.current = img;
      renderFrame();
    };
    img.src = photoSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoSrc]);

  // ---------------------------------------------------------------------------
  // Load hair overlay image when style changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!asset.src) {
      hairImgRef.current = null;
      renderFrame();
      return;
    }
    if (hairImgSrcRef.current === asset.src && hairImgRef.current) {
      renderFrame();
      return;
    }

    const img = new Image();
    img.onload = () => {
      hairImgRef.current = img;
      hairImgSrcRef.current = asset.src;
      renderFrame();
    };
    img.onerror = () => {
      hairImgRef.current = null;
      renderFrame();
    };
    img.src = asset.src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.src]);

  // ---------------------------------------------------------------------------
  // Re-render when opacity changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    renderFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opacity, currentIndex]);

  // ---------------------------------------------------------------------------
  // Core render function
  // ---------------------------------------------------------------------------

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const photoImg = photoImgRef.current;
    if (!canvas || !photoImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution to photo dimensions
    canvas.width = photoWidth;
    canvas.height = photoHeight;

    setIsRendering(true);

    // Draw photo
    ctx.drawImage(photoImg, 0, 0, photoWidth, photoHeight);

    // Draw hair overlay if available
    const hairImg = hairImgRef.current;
    if (hairImg && asset.src) {
      const transform = computeOverlayTransform(
        landmarks,
        photoWidth,
        photoHeight,
        asset,
        opacity
      );
      drawHairOverlay(ctx, photoImg, hairImg, transform);
    }

    setIsRendering(false);
  }, [landmarks, photoWidth, photoHeight, asset, opacity]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % recommendations.length);
    hairImgRef.current = null; // force reload
    hairImgSrcRef.current = '';
  }, [recommendations.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + recommendations.length) % recommendations.length);
    hairImgRef.current = null;
    hairImgSrcRef.current = '';
  }, [recommendations.length]);

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.download = `hairmatch-${currentStyle?.id ?? 'preview'}.jpg`;
    link.href = dataUrl;
    link.click();

    setSaveLabel(t('results.saveSuccess'));
    setTimeout(() => setSaveLabel(null), 2500);
  }, [currentStyle, t]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Style Preview">
      {/* Backdrop */}
      <div className="preview-backdrop" onClick={onClose} />

      {/* Modal content */}
      <div className="preview-content">
        {/* Header */}
        <div className="preview-header">
          <div className="preview-title-area">
            <span className="preview-style-name">{currentStyle?.name ?? '—'}</span>
            <span className="preview-counter">
              {currentIndex + 1} / {recommendations.length}
            </span>
          </div>
          <button id="btn-preview-close" className="preview-close-btn" onClick={onClose} aria-label="Close preview">
            ✕
          </button>
        </div>

        {/* Canvas */}
        <div className="preview-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            aria-label={`Style preview: ${currentStyle?.name}`}
          />
          {isRendering && (
            <div className="preview-loading-overlay">
              <div className="processing-spinner" />
            </div>
          )}

          {/* Side nav arrows */}
          {recommendations.length > 1 && (
            <>
              <button
                id="btn-preview-prev"
                className="preview-nav preview-nav-prev"
                onClick={goPrev}
                aria-label="Previous style"
              >
                ‹
              </button>
              <button
                id="btn-preview-next"
                className="preview-nav preview-nav-next"
                onClick={goNext}
                aria-label="Next style"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="preview-controls">
          {/* Opacity slider */}
          <div className="preview-slider-row">
            <label htmlFor="opacity-slider" className="preview-slider-label">
              💧 {t('preview.opacity')}: {Math.round(opacity * 100)}%
            </label>
            <input
              id="opacity-slider"
              type="range"
              min={0.3}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="preview-slider"
            />
          </div>

          {/* Style dots */}
          <div className="preview-dots" role="tablist">
            {recommendations.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentIndex}
                className={`preview-dot ${i === currentIndex ? 'preview-dot-active' : ''}`}
                onClick={() => {
                  hairImgRef.current = null;
                  hairImgSrcRef.current = '';
                  setCurrentIndex(i);
                }}
                aria-label={`Style ${i + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="preview-actions">
            <button
              id="btn-save-preview"
              className="btn btn-primary"
              onClick={handleSave}
            >
              {saveLabel ?? `⬇ ${t('results.saveCta')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
