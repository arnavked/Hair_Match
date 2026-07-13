import { describe, it, expect } from 'vitest';
import { validatePhoto } from '@/core/photo-validation/photo-validation';
import type { FaceDetectionResult } from '@/core/face-detection/face-detection.types';

describe('Photo Validation Gate', () => {
  const dummyLandmarks = Array.from({ length: 468 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));

  // Helper to create a face result
  const createFaceResult = (
    width: number = 0.4,
    x: number = 0.3
  ): FaceDetectionResult => ({
    landmarks: dummyLandmarks,
    faceCount: 1,
    boundingBox: { x, y: 0.2, width, height: 0.5 },
    processingTimeMs: 10,
  });

  it('rejects when zero faces are detected (NO_FACE)', () => {
    const result = validatePhoto([], 1000, 1000);
    expect(result.isValid).toBe(false);
    expect(result.reasonCode).toBe('NO_FACE');
  });

  it('rejects when multiple faces are detected (MULTIPLE_FACES)', () => {
    const result = validatePhoto(
      [createFaceResult(), createFaceResult()],
      1000,
      1000
    );
    expect(result.isValid).toBe(false);
    expect(result.reasonCode).toBe('MULTIPLE_FACES');
  });

  it('rejects when face is too small (FACE_TOO_SMALL)', () => {
    // boundingBox width = 0.1 * 1000px = 100px (< 150px)
    const face = createFaceResult(0.1);
    const result = validatePhoto([face], 1000, 1000);
    expect(result.isValid).toBe(false);
    expect(result.reasonCode).toBe('FACE_TOO_SMALL');
  });

  it('rejects when face is not frontal / asymmetric (NOT_FRONTAL)', () => {
    // Mock landmarks where left width != right width significantly
    // Nose midline: 1, Left cheek: 234, Right cheek: 454
    const asymmetricLandmarks = [...dummyLandmarks];
    
    // nose midline x = 0.5
    asymmetricLandmarks[1] = { x: 0.5, y: 0.5, z: 0 };
    // left cheek x = 0.2 (distance left = 0.3)
    asymmetricLandmarks[234] = { x: 0.2, y: 0.5, z: 0 };
    // right cheek x = 0.9 (distance right = 0.4)
    asymmetricLandmarks[454] = { x: 0.9, y: 0.5, z: 0 };

    const face: FaceDetectionResult = {
      landmarks: asymmetricLandmarks,
      faceCount: 1,
      boundingBox: { x: 0.2, y: 0.2, width: 0.7, height: 0.7 },
      processingTimeMs: 12,
    };

    // symmetry ratio = 0.3 / 0.4 = 0.75 exactly. Let's make it more asymmetric
    asymmetricLandmarks[454] = { x: 0.95, y: 0.5, z: 0 }; // distance right = 0.45
    // symmetry ratio = 0.3 / 0.45 = 0.666 (< 0.75)

    const result = validatePhoto([face], 1000, 1000);
    expect(result.isValid).toBe(false);
    expect(result.reasonCode).toBe('NOT_FRONTAL');
    expect(result.details?.symmetryRatio).toBeLessThan(0.75);
  });

  it('passes when exactly one valid frontal face is provided', () => {
    const symmetricLandmarks = [...dummyLandmarks];
    // nose midline x = 0.5
    symmetricLandmarks[1] = { x: 0.5, y: 0.5, z: 0 };
    // left cheek x = 0.2 (distance left = 0.3)
    symmetricLandmarks[234] = { x: 0.2, y: 0.5, z: 0 };
    // right cheek x = 0.8 (distance right = 0.3)
    symmetricLandmarks[454] = { x: 0.8, y: 0.5, z: 0 };

    const face: FaceDetectionResult = {
      landmarks: symmetricLandmarks,
      faceCount: 1,
      boundingBox: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
      processingTimeMs: 15,
    };

    const result = validatePhoto([face], 1000, 1000);
    expect(result.isValid).toBe(true);
    expect(result.details?.faceWidthPx).toBe(600);
    expect(result.details?.symmetryRatio).toBeCloseTo(1.0);
  });
});
