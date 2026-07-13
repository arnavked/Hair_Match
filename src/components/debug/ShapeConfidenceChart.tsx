/**
 * ShapeConfidenceChart — HairMatch (B2-08)
 *
 * Debug-mode bar chart showing the softmax confidence scores
 * for each of the 5 face shapes. Highest-scoring shape is highlighted.
 *
 * ONLY rendered in development mode — stripped from production builds.
 */

import type { FaceShapeScores, FaceShape } from '@/types';
import { FACE_SHAPES } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShapeConfidenceChartProps {
  /** 5-class confidence scores. */
  scores: FaceShapeScores;
  /** Which classifier produced these scores. */
  classifierType: 'rules' | 'onnx';
}

// ---------------------------------------------------------------------------
// Shape display config
// ---------------------------------------------------------------------------

const SHAPE_COLORS: Record<FaceShape, string> = {
  oval: '#7c5cfc',      // Purple
  round: '#ff6b9d',     // Pink
  square: '#4ade80',    // Green
  heart: '#f87171',     // Red
  oblong: '#fbbf24',    // Amber
};

const SHAPE_EMOJI: Record<FaceShape, string> = {
  oval: '🥚',
  round: '🔵',
  square: '🟨',
  heart: '💜',
  oblong: '📏',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShapeConfidenceChart({
  scores,
  classifierType,
}: ShapeConfidenceChartProps) {
  // Don't render in production
  if (!import.meta.env.DEV) {
    return null;
  }

  // Find the dominant shape
  let maxShape: FaceShape = 'oval';
  let maxScore = -1;
  for (const shape of FACE_SHAPES) {
    if (scores[shape] > maxScore) {
      maxScore = scores[shape];
      maxShape = shape;
    }
  }

  return (
    <div className="confidence-chart" data-testid="shape-confidence-chart">
      <div className="confidence-header">
        <span className="confidence-label">Shape Confidence</span>
        <span className="confidence-badge">
          {classifierType === 'onnx' ? '🧠 ML' : '📐 Rules'}
        </span>
      </div>

      <div className="confidence-bars">
        {FACE_SHAPES.map((shape) => {
          const score = scores[shape];
          const pct = (score * 100).toFixed(1);
          const isDominant = shape === maxShape;

          return (
            <div
              key={shape}
              className={`confidence-bar-row ${isDominant ? 'dominant' : ''}`}
            >
              <span className="bar-label">
                {SHAPE_EMOJI[shape]} {shape}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${score * 100}%`,
                    backgroundColor: isDominant
                      ? SHAPE_COLORS[shape]
                      : `${SHAPE_COLORS[shape]}66`,
                  }}
                />
              </div>
              <span className="bar-value">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
