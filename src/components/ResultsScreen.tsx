/**
 * ResultsScreen — HairMatch (B3-04 + B4-03)
 *
 * Displays scored hairstyle recommendations as premium style cards.
 * Each card has a "Preview on me" button that opens the StylePreviewCanvas.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScoredRecommendation } from '@/core/recommender';
import type { FaceShape } from '@/types';
import type { NormalizedLandmark } from '@/core/face-detection/face-detection.types';
import { StylePreviewCanvas } from './StylePreviewCanvas';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResultsScreenProps {
  recommendations: ScoredRecommendation[];
  dominantShape: FaceShape;
  /** User photo URL — needed for preview modal. */
  photoSrc: string;
  photoWidth: number;
  photoHeight: number;
  landmarks: NormalizedLandmark[];
  onReset: () => void;
  onBookStyle: (styleId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResultsScreen({
  recommendations,
  dominantShape,
  photoSrc,
  photoWidth,
  photoHeight,
  landmarks,
  onReset,
  onBookStyle,
}: ResultsScreenProps) {
  const { t } = useTranslation();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const shapeEmoji: Record<FaceShape, string> = {
    oval: '🥚', round: '🔵', square: '🟨', heart: '💜', oblong: '📏',
  };

  return (
    <>
      <div className="results-screen" id="results-screen">
        {/* Header */}
        <div className="results-screen-header">
          <span className="results-shape-badge">
            {shapeEmoji[dominantShape]} {t(`shapes.${dominantShape}`)}
          </span>
          <h2 className="results-screen-title">{t('results.title')}</h2>
          <p className="results-screen-subtitle">
            {t('results.subtitle', { shape: t(`shapes.${dominantShape}`) })}
          </p>
        </div>

        {/* Style Cards Grid */}
        <div className="style-cards-grid">
          {recommendations.map((rec, index) => (
            <StyleCard
              key={rec.style.id}
              recommendation={rec}
              rank={index + 1}
              onPreview={() => setPreviewIndex(index)}
              onBookStyle={() => onBookStyle(rec.style.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="results-footer">
          <button id="btn-try-different" className="btn btn-secondary" onClick={onReset}>
            {t('results.tryDifferent')}
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {previewIndex !== null && (
        <StylePreviewCanvas
          photoSrc={photoSrc}
          photoWidth={photoWidth}
          photoHeight={photoHeight}
          landmarks={landmarks}
          recommendations={recommendations}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onBookStyle={onBookStyle}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Style Card
// ---------------------------------------------------------------------------

interface StyleCardProps {
  recommendation: ScoredRecommendation;
  rank: number;
  onPreview: () => void;
  onBookStyle: () => void;
}

function StyleCard({ recommendation, rank, onPreview, onBookStyle }: StyleCardProps) {
  const { style, score, rationale } = recommendation;
  const { t } = useTranslation();
  const hasImage = Boolean(style.imagePath);

  return (
    <article
      className={`style-card ${rank === 1 ? 'style-card-top' : ''}`}
      id={`style-card-${style.id}`}
      aria-label={`${style.name}, ${score}% match`}
      style={{ animationDelay: `${(rank - 1) * 0.06}s` }}
    >
      {/* Match score badge */}
      <div className="style-card-score-badge">
        <span className="score-number">{score}</span>
        <span className="score-label">%</span>
      </div>

      {/* Best match badge */}
      {rank === 1 && (
        <div className="best-match-badge">✨ {t('results.bestMatch')}</div>
      )}

      {/* Image */}
      <div className="style-card-image-wrap">
        {hasImage ? (
          <img
            src={style.imagePath}
            alt={style.name}
            className="style-card-image"
            loading="lazy"
          />
        ) : (
          <div className="style-card-image-placeholder">
            <span className="placeholder-icon">✂️</span>
          </div>
        )}

        {/* Preview overlay button on hover */}
        <button
          id={`btn-preview-${style.id}`}
          className="style-card-preview-btn"
          onClick={onPreview}
          aria-label={`Preview ${style.name} on my photo`}
        >
          👤 {t('results.previewCta')}
        </button>
      </div>

      {/* Content */}
      <div className="style-card-content">
        <h3 className="style-card-name">{style.name}</h3>
        <p className="style-card-description">{style.description}</p>

        <div className="style-card-tags">
          {style.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="style-tag">#{tag}</span>
          ))}
        </div>

        <p className="style-card-rationale">{rationale}</p>
        
        <button 
          className="btn btn-primary style-card-book-btn" 
          onClick={onBookStyle}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {t('booking.bookCta')}
        </button>
      </div>
    </article>
  );
}
