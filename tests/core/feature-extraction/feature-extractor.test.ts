import { describe, it, expect } from 'vitest';
import { extractFeatures } from '@/core/feature-extraction/feature-extractor';
import { NUM_FEATURES, FEATURE_NAMES } from '@/core/feature-extraction/feature-extractor.types';
import type { NormalizedLandmark } from '@/core/face-detection/face-detection.types';

/**
 * Create a fixture set of 468 landmarks approximating a given face shape.
 *
 * Since MediaPipe landmarks are normalized [0, 1], we position key
 * anchor landmarks to simulate different face proportions:
 *
 * - Oval: height ≈ 1.5× width, balanced proportions
 * - Round: height ≈ width, full cheeks
 * - Square: height ≈ width, wide jaw, angular
 * - Heart: wide forehead, narrow jaw
 * - Oblong: height > 1.6× width, narrow
 */
function createLandmarks(shape: 'oval' | 'round' | 'square' | 'heart' | 'oblong'): NormalizedLandmark[] {
  // Base landmarks — all at face center
  const landmarks: NormalizedLandmark[] = Array.from({ length: 468 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Key landmark indices (from landmark-indices.ts)
  const FOREHEAD_CENTER = 10;
  const CHIN = 152;
  const LEFT_CHEEK_CONTOUR = 234;
  const RIGHT_CHEEK_CONTOUR = 454;
  const LEFT_FOREHEAD = 67;
  const RIGHT_FOREHEAD = 297;
  const LEFT_JAW_ANGLE = 172;
  const RIGHT_JAW_ANGLE = 397;
  const LEFT_JAW_MID = 136;
  const RIGHT_JAW_MID = 365;
  const LEFT_CHEEKBONE = 123;
  const RIGHT_CHEEKBONE = 352;
  const LEFT_TEMPLE = 21;
  const RIGHT_TEMPLE = 251;
  const NOSE_TIP = 4;
  const NOSE_BRIDGE = 6;
  const NOSE_MIDLINE = 1;
  const LEFT_EYE_OUTER = 33;
  const RIGHT_EYE_OUTER = 263;

  // Shared: nose/midline always centered
  landmarks[NOSE_MIDLINE] = { x: 0.5, y: 0.5, z: 0 };
  landmarks[NOSE_BRIDGE] = { x: 0.5, y: 0.42, z: 0 };
  landmarks[NOSE_TIP] = { x: 0.5, y: 0.52, z: 0 };

  // Eyes roughly positioned
  landmarks[LEFT_EYE_OUTER] = { x: 0.35, y: 0.42, z: 0 };
  landmarks[RIGHT_EYE_OUTER] = { x: 0.65, y: 0.42, z: 0 };

  switch (shape) {
    case 'oval':
      // Height ≈ 1.5× width
      landmarks[FOREHEAD_CENTER] = { x: 0.5, y: 0.2, z: 0 };
      landmarks[CHIN] = { x: 0.5, y: 0.8, z: 0 };
      landmarks[LEFT_CHEEK_CONTOUR] = { x: 0.3, y: 0.5, z: 0 };
      landmarks[RIGHT_CHEEK_CONTOUR] = { x: 0.7, y: 0.5, z: 0 };
      landmarks[LEFT_FOREHEAD] = { x: 0.32, y: 0.28, z: 0 };
      landmarks[RIGHT_FOREHEAD] = { x: 0.68, y: 0.28, z: 0 };
      landmarks[LEFT_JAW_ANGLE] = { x: 0.34, y: 0.68, z: 0 };
      landmarks[RIGHT_JAW_ANGLE] = { x: 0.66, y: 0.68, z: 0 };
      landmarks[LEFT_JAW_MID] = { x: 0.38, y: 0.74, z: 0 };
      landmarks[RIGHT_JAW_MID] = { x: 0.62, y: 0.74, z: 0 };
      landmarks[LEFT_CHEEKBONE] = { x: 0.31, y: 0.45, z: 0 };
      landmarks[RIGHT_CHEEKBONE] = { x: 0.69, y: 0.45, z: 0 };
      landmarks[LEFT_TEMPLE] = { x: 0.31, y: 0.32, z: 0 };
      landmarks[RIGHT_TEMPLE] = { x: 0.69, y: 0.32, z: 0 };
      break;

    case 'round':
      // Height ≈ width, full cheeks, rounded jawline
      landmarks[FOREHEAD_CENTER] = { x: 0.5, y: 0.25, z: 0 };
      landmarks[CHIN] = { x: 0.5, y: 0.75, z: 0 };
      landmarks[LEFT_CHEEK_CONTOUR] = { x: 0.25, y: 0.5, z: 0 };
      landmarks[RIGHT_CHEEK_CONTOUR] = { x: 0.75, y: 0.5, z: 0 };
      landmarks[LEFT_FOREHEAD] = { x: 0.3, y: 0.3, z: 0 };
      landmarks[RIGHT_FOREHEAD] = { x: 0.7, y: 0.3, z: 0 };
      landmarks[LEFT_JAW_ANGLE] = { x: 0.32, y: 0.65, z: 0 };
      landmarks[RIGHT_JAW_ANGLE] = { x: 0.68, y: 0.65, z: 0 };
      landmarks[LEFT_JAW_MID] = { x: 0.38, y: 0.7, z: 0 };
      landmarks[RIGHT_JAW_MID] = { x: 0.62, y: 0.7, z: 0 };
      landmarks[LEFT_CHEEKBONE] = { x: 0.27, y: 0.45, z: 0 };
      landmarks[RIGHT_CHEEKBONE] = { x: 0.73, y: 0.45, z: 0 };
      landmarks[LEFT_TEMPLE] = { x: 0.3, y: 0.32, z: 0 };
      landmarks[RIGHT_TEMPLE] = { x: 0.7, y: 0.32, z: 0 };
      break;

    case 'square':
      // Height ≈ width, wide jaw matching forehead, angular
      landmarks[FOREHEAD_CENTER] = { x: 0.5, y: 0.25, z: 0 };
      landmarks[CHIN] = { x: 0.5, y: 0.75, z: 0 };
      landmarks[LEFT_CHEEK_CONTOUR] = { x: 0.25, y: 0.5, z: 0 };
      landmarks[RIGHT_CHEEK_CONTOUR] = { x: 0.75, y: 0.5, z: 0 };
      landmarks[LEFT_FOREHEAD] = { x: 0.28, y: 0.28, z: 0 };
      landmarks[RIGHT_FOREHEAD] = { x: 0.72, y: 0.28, z: 0 };
      landmarks[LEFT_JAW_ANGLE] = { x: 0.28, y: 0.65, z: 0 };
      landmarks[RIGHT_JAW_ANGLE] = { x: 0.72, y: 0.65, z: 0 };
      landmarks[LEFT_JAW_MID] = { x: 0.3, y: 0.72, z: 0 };
      landmarks[RIGHT_JAW_MID] = { x: 0.7, y: 0.72, z: 0 };
      landmarks[LEFT_CHEEKBONE] = { x: 0.27, y: 0.45, z: 0 };
      landmarks[RIGHT_CHEEKBONE] = { x: 0.73, y: 0.45, z: 0 };
      landmarks[LEFT_TEMPLE] = { x: 0.28, y: 0.3, z: 0 };
      landmarks[RIGHT_TEMPLE] = { x: 0.72, y: 0.3, z: 0 };
      break;

    case 'heart':
      // Wide forehead, narrow jaw/chin
      landmarks[FOREHEAD_CENTER] = { x: 0.5, y: 0.22, z: 0 };
      landmarks[CHIN] = { x: 0.5, y: 0.78, z: 0 };
      landmarks[LEFT_CHEEK_CONTOUR] = { x: 0.28, y: 0.5, z: 0 };
      landmarks[RIGHT_CHEEK_CONTOUR] = { x: 0.72, y: 0.5, z: 0 };
      landmarks[LEFT_FOREHEAD] = { x: 0.26, y: 0.28, z: 0 };
      landmarks[RIGHT_FOREHEAD] = { x: 0.74, y: 0.28, z: 0 };
      landmarks[LEFT_JAW_ANGLE] = { x: 0.38, y: 0.68, z: 0 };
      landmarks[RIGHT_JAW_ANGLE] = { x: 0.62, y: 0.68, z: 0 };
      landmarks[LEFT_JAW_MID] = { x: 0.42, y: 0.74, z: 0 };
      landmarks[RIGHT_JAW_MID] = { x: 0.58, y: 0.74, z: 0 };
      landmarks[LEFT_CHEEKBONE] = { x: 0.29, y: 0.43, z: 0 };
      landmarks[RIGHT_CHEEKBONE] = { x: 0.71, y: 0.43, z: 0 };
      landmarks[LEFT_TEMPLE] = { x: 0.27, y: 0.3, z: 0 };
      landmarks[RIGHT_TEMPLE] = { x: 0.73, y: 0.3, z: 0 };
      break;

    case 'oblong':
      // Much taller than wide
      landmarks[FOREHEAD_CENTER] = { x: 0.5, y: 0.15, z: 0 };
      landmarks[CHIN] = { x: 0.5, y: 0.85, z: 0 };
      landmarks[LEFT_CHEEK_CONTOUR] = { x: 0.32, y: 0.5, z: 0 };
      landmarks[RIGHT_CHEEK_CONTOUR] = { x: 0.68, y: 0.5, z: 0 };
      landmarks[LEFT_FOREHEAD] = { x: 0.34, y: 0.22, z: 0 };
      landmarks[RIGHT_FOREHEAD] = { x: 0.66, y: 0.22, z: 0 };
      landmarks[LEFT_JAW_ANGLE] = { x: 0.35, y: 0.72, z: 0 };
      landmarks[RIGHT_JAW_ANGLE] = { x: 0.65, y: 0.72, z: 0 };
      landmarks[LEFT_JAW_MID] = { x: 0.38, y: 0.78, z: 0 };
      landmarks[RIGHT_JAW_MID] = { x: 0.62, y: 0.78, z: 0 };
      landmarks[LEFT_CHEEKBONE] = { x: 0.33, y: 0.45, z: 0 };
      landmarks[RIGHT_CHEEKBONE] = { x: 0.67, y: 0.45, z: 0 };
      landmarks[LEFT_TEMPLE] = { x: 0.33, y: 0.26, z: 0 };
      landmarks[RIGHT_TEMPLE] = { x: 0.67, y: 0.26, z: 0 };
      break;
  }

  // Also place face oval contour landmarks for circularity computation
  // Use a simple ellipse approximation based on the shape
  const contourIndices = [
    10, 338, 297, 332, 284, 251, 389, 356, 454,
    323, 361, 288, 397, 365, 379, 378, 400, 377,
    152, 148, 176, 149, 150, 136, 172, 58, 132,
    93, 234, 127, 162, 21, 54, 103, 67, 109,
  ];

  const cx = 0.5;
  const cy = (landmarks[FOREHEAD_CENTER].y + landmarks[CHIN].y) / 2;
  const rx = (landmarks[RIGHT_CHEEK_CONTOUR].x - landmarks[LEFT_CHEEK_CONTOUR].x) / 2;
  const ry = (landmarks[CHIN].y - landmarks[FOREHEAD_CENTER].y) / 2;

  contourIndices.forEach((idx, i) => {
    // Skip indices we've already set as anchor points
    if ([FOREHEAD_CENTER, CHIN, LEFT_CHEEK_CONTOUR, RIGHT_CHEEK_CONTOUR,
         LEFT_FOREHEAD, RIGHT_FOREHEAD, LEFT_TEMPLE, RIGHT_TEMPLE,
         LEFT_JAW_ANGLE, RIGHT_JAW_ANGLE, LEFT_JAW_MID, RIGHT_JAW_MID].includes(idx)) {
      return;
    }
    const angle = (i / contourIndices.length) * 2 * Math.PI;
    landmarks[idx] = {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      z: 0,
    };
  });

  // Jawline contour
  const jawlineIndices = [234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454];
  jawlineIndices.forEach((idx, i) => {
    if (landmarks[idx].x !== 0.5 || landmarks[idx].y !== 0.5) return; // already set
    const t = i / (jawlineIndices.length - 1);
    landmarks[idx] = {
      x: landmarks[LEFT_CHEEK_CONTOUR].x + t * (landmarks[RIGHT_CHEEK_CONTOUR].x - landmarks[LEFT_CHEEK_CONTOUR].x),
      y: landmarks[FOREHEAD_CENTER].y + Math.sin(t * Math.PI) * (landmarks[CHIN].y - landmarks[FOREHEAD_CENTER].y) * 0.3,
      z: 0,
    };
  });

  return landmarks;
}

describe('Feature Extractor (B2-01)', () => {
  it('produces 18 features', () => {
    const landmarks = createLandmarks('oval');
    const features = extractFeatures(landmarks);

    expect(features.values).toBeInstanceOf(Float32Array);
    expect(features.values.length).toBe(NUM_FEATURES);
    expect(features.names.length).toBe(NUM_FEATURES);
    expect(features.names).toEqual(FEATURE_NAMES);
  });

  it('produces no NaN or Infinity values', () => {
    for (const shape of ['oval', 'round', 'square', 'heart', 'oblong'] as const) {
      const landmarks = createLandmarks(shape);
      const features = extractFeatures(landmarks);

      for (let i = 0; i < features.values.length; i++) {
        expect(Number.isFinite(features.values[i])).toBe(true);
      }
    }
  });

  it('oval face has height/width ratio near 1.5', () => {
    const features = extractFeatures(createLandmarks('oval'));
    expect(features.named.faceHeightToWidthRatio).toBeGreaterThan(1.3);
    expect(features.named.faceHeightToWidthRatio).toBeLessThan(1.7);
  });

  it('round face has height/width ratio near 1.0', () => {
    const features = extractFeatures(createLandmarks('round'));
    expect(features.named.faceHeightToWidthRatio).toBeGreaterThan(0.8);
    expect(features.named.faceHeightToWidthRatio).toBeLessThan(1.3);
  });

  it('heart face has high foreheadToJaw ratio', () => {
    const features = extractFeatures(createLandmarks('heart'));
    expect(features.named.foreheadToJawRatio).toBeGreaterThan(1.5);
  });

  it('oblong face has high height/width ratio', () => {
    const features = extractFeatures(createLandmarks('oblong'));
    expect(features.named.faceHeightToWidthRatio).toBeGreaterThan(1.7);
  });

  it('square face has jaw width close to forehead width', () => {
    const features = extractFeatures(createLandmarks('square'));
    expect(features.named.foreheadToJawRatio).toBeGreaterThan(0.85);
    expect(features.named.foreheadToJawRatio).toBeLessThan(1.15);
  });

  it('symmetry is near 1.0 for symmetric fixtures', () => {
    for (const shape of ['oval', 'round', 'square', 'heart', 'oblong'] as const) {
      const features = extractFeatures(createLandmarks(shape));
      expect(features.named.facialSymmetry).toBeGreaterThan(0.9);
    }
  });

  it('throws if landmarks array is too short', () => {
    const shortLandmarks = Array.from({ length: 100 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    expect(() => extractFeatures(shortLandmarks)).toThrow('Expected 468 landmarks');
  });
});
