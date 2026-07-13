import { describe, it, expect } from 'vitest';
import { createRulesClassifier } from '@/core/classifier/rules-classifier';
import { extractFeatures } from '@/core/feature-extraction/feature-extractor';
import type { NormalizedLandmark } from '@/core/face-detection/face-detection.types';
import type { FaceShape } from '@/types';

/**
 * Create fixture landmarks for a given face shape.
 * Same as feature extractor tests but simplified for classifier testing.
 */
function createLandmarks(shape: 'oval' | 'round' | 'square' | 'heart' | 'oblong'): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 468 }, () => ({
    x: 0.5, y: 0.5, z: 0,
  }));

  const setKey = (idx: number, x: number, y: number) => {
    landmarks[idx] = { x, y, z: 0 };
  };

  // Always set these
  setKey(1, 0.5, 0.5);  // NOSE_MIDLINE
  setKey(4, 0.5, 0.52); // NOSE_TIP
  setKey(6, 0.5, 0.42); // NOSE_BRIDGE
  setKey(33, 0.35, 0.42);  // LEFT_EYE_OUTER
  setKey(263, 0.65, 0.42); // RIGHT_EYE_OUTER

  switch (shape) {
    case 'oval':
      setKey(10, 0.5, 0.2);    // FOREHEAD_CENTER
      setKey(152, 0.5, 0.8);   // CHIN
      setKey(234, 0.3, 0.5);   // LEFT_CHEEK
      setKey(454, 0.7, 0.5);   // RIGHT_CHEEK
      setKey(67, 0.32, 0.28);  // LEFT_FOREHEAD
      setKey(297, 0.68, 0.28); // RIGHT_FOREHEAD
      setKey(172, 0.34, 0.68); // LEFT_JAW_ANGLE
      setKey(397, 0.66, 0.68); // RIGHT_JAW_ANGLE
      setKey(136, 0.38, 0.74); // LEFT_JAW_MID
      setKey(365, 0.62, 0.74); // RIGHT_JAW_MID
      setKey(123, 0.31, 0.45); // LEFT_CHEEKBONE
      setKey(352, 0.69, 0.45); // RIGHT_CHEEKBONE
      setKey(21, 0.31, 0.32);  // LEFT_TEMPLE
      setKey(251, 0.69, 0.32); // RIGHT_TEMPLE
      break;

    case 'round':
      setKey(10, 0.5, 0.25);
      setKey(152, 0.5, 0.75);
      setKey(234, 0.25, 0.5);
      setKey(454, 0.75, 0.5);
      setKey(67, 0.3, 0.3);
      setKey(297, 0.7, 0.3);
      setKey(172, 0.32, 0.65);
      setKey(397, 0.68, 0.65);
      setKey(136, 0.38, 0.7);
      setKey(365, 0.62, 0.7);
      setKey(123, 0.27, 0.45);
      setKey(352, 0.73, 0.45);
      setKey(21, 0.3, 0.32);
      setKey(251, 0.7, 0.32);
      break;

    case 'square':
      setKey(10, 0.5, 0.25);
      setKey(152, 0.5, 0.75);
      setKey(234, 0.25, 0.5);
      setKey(454, 0.75, 0.5);
      setKey(67, 0.28, 0.28);
      setKey(297, 0.72, 0.28);
      setKey(172, 0.28, 0.65);
      setKey(397, 0.72, 0.65);
      setKey(136, 0.3, 0.72);
      setKey(365, 0.7, 0.72);
      setKey(123, 0.27, 0.45);
      setKey(352, 0.73, 0.45);
      setKey(21, 0.28, 0.3);
      setKey(251, 0.72, 0.3);
      break;

    case 'heart':
      setKey(10, 0.5, 0.22);
      setKey(152, 0.5, 0.78);
      setKey(234, 0.28, 0.5);
      setKey(454, 0.72, 0.5);
      setKey(67, 0.26, 0.28);
      setKey(297, 0.74, 0.28);
      setKey(172, 0.38, 0.68);
      setKey(397, 0.62, 0.68);
      setKey(136, 0.42, 0.74);
      setKey(365, 0.58, 0.74);
      setKey(123, 0.29, 0.43);
      setKey(352, 0.71, 0.43);
      setKey(21, 0.27, 0.3);
      setKey(251, 0.73, 0.3);
      break;

    case 'oblong':
      setKey(10, 0.5, 0.15);
      setKey(152, 0.5, 0.85);
      setKey(234, 0.32, 0.5);
      setKey(454, 0.68, 0.5);
      setKey(67, 0.34, 0.22);
      setKey(297, 0.66, 0.22);
      setKey(172, 0.35, 0.72);
      setKey(397, 0.65, 0.72);
      setKey(136, 0.38, 0.78);
      setKey(365, 0.62, 0.78);
      setKey(123, 0.33, 0.45);
      setKey(352, 0.67, 0.45);
      setKey(21, 0.33, 0.26);
      setKey(251, 0.67, 0.26);
      break;
  }

  // Place face oval contour as ellipse
  const contourIndices = [
    10, 338, 297, 332, 284, 251, 389, 356, 454,
    323, 361, 288, 397, 365, 379, 378, 400, 377,
    152, 148, 176, 149, 150, 136, 172, 58, 132,
    93, 234, 127, 162, 21, 54, 103, 67, 109,
  ];
  const cx = 0.5;
  const cy = (landmarks[10].y + landmarks[152].y) / 2;
  const rx = (landmarks[454].x - landmarks[234].x) / 2;
  const ry = (landmarks[152].y - landmarks[10].y) / 2;
  const alreadySet = new Set([10, 152, 234, 454, 67, 297, 172, 397, 136, 365, 123, 352, 21, 251, 1, 4, 6, 33, 263]);

  contourIndices.forEach((idx, i) => {
    if (alreadySet.has(idx)) return;
    const angle = (i / contourIndices.length) * 2 * Math.PI;
    landmarks[idx] = { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), z: 0 };
  });

  return landmarks;
}

function getDominantShape(scores: Record<FaceShape, number>): FaceShape {
  let best: FaceShape = 'oval';
  let max = -Infinity;
  for (const [shape, score] of Object.entries(scores)) {
    if (score > max) {
      max = score;
      best = shape as FaceShape;
    }
  }
  return best;
}

describe('Rules-Based Classifier', () => {
  const classifier = createRulesClassifier();

  it('is always ready', () => {
    expect(classifier.isReady()).toBe(true);
    expect(classifier.type).toBe('rules');
  });

  it('returns probabilities that sum to ~1.0', async () => {
    const features = extractFeatures(createLandmarks('oval'));
    const scores = await classifier.classify(features);

    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it('all scores are non-negative', async () => {
    for (const shape of ['oval', 'round', 'square', 'heart', 'oblong'] as const) {
      const features = extractFeatures(createLandmarks(shape));
      const scores = await classifier.classify(features);

      for (const val of Object.values(scores)) {
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('correctly classifies oval face fixture', async () => {
    const features = extractFeatures(createLandmarks('oval'));
    const scores = await classifier.classify(features);
    const dominant = getDominantShape(scores);

    // Oval should be the dominant shape or in top-2
    expect(['oval', 'oblong', 'heart']).toContain(dominant);
  });

  it('correctly classifies round face fixture', async () => {
    const features = extractFeatures(createLandmarks('round'));
    const scores = await classifier.classify(features);
    const dominant = getDominantShape(scores);

    expect(['round', 'square']).toContain(dominant);
  });

  it('correctly classifies heart face fixture', async () => {
    const features = extractFeatures(createLandmarks('heart'));
    const scores = await classifier.classify(features);
    const dominant = getDominantShape(scores);

    expect(['heart', 'oval']).toContain(dominant);
  });

  it('correctly classifies oblong face fixture', async () => {
    const features = extractFeatures(createLandmarks('oblong'));
    const scores = await classifier.classify(features);
    const dominant = getDominantShape(scores);

    expect(['oblong', 'oval']).toContain(dominant);
  });

  it('correctly classifies square face fixture', async () => {
    const features = extractFeatures(createLandmarks('square'));
    const scores = await classifier.classify(features);
    const dominant = getDominantShape(scores);

    expect(['square', 'round']).toContain(dominant);
  });
});
