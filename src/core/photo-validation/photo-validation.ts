/**
 * Photo Validation Gate — HairMatch (B1-03)
 *
 * Validates that a photo meets quality requirements before processing.
 * Checks:
 *   1. Exactly one face detected
 *   2. Face width >= 150px
 *   3. Face is frontal (symmetry ratio >= 0.75)
 *
 * Symmetry ratio is defined as:
 *   min(left_half_width, right_half_width) / max(left_half_width, right_half_width)
 * measured from nose midline landmark to face contour landmark on each side.
 */

import type { FaceDetectionResult, NormalizedLandmark } from '../face-detection/face-detection.types';
import {
  NOSE_MIDLINE,
  LEFT_CHEEK_CONTOUR,
  RIGHT_CHEEK_CONTOUR,
} from '../face-detection/landmark-indices';
import type {
  ValidationResult,
  ValidationThresholds,
} from './photo-validation.types';
import {
  DEFAULT_VALIDATION_THRESHOLDS,
} from './photo-validation.types';

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------

/**
 * Validate a photo based on face detection results.
 *
 * @param detectionResults - Array of face detection results from MediaPipe.
 * @param imageWidth - Width of the original image in pixels.
 * @param imageHeight - Height of the original image in pixels.
 * @param thresholds - Optional custom validation thresholds.
 * @returns Validation result with pass/fail status and details.
 */
export function validatePhoto(
  detectionResults: FaceDetectionResult[],
  imageWidth: number,
  _imageHeight: number,
  thresholds: ValidationThresholds = DEFAULT_VALIDATION_THRESHOLDS
): ValidationResult {
  const faceCount = detectionResults.length;

  // Check 1: No face detected
  if (faceCount === 0) {
    return {
      isValid: false,
      reasonCode: 'NO_FACE',
      details: { faceCount: 0 },
    };
  }

  // Check 2: Multiple faces detected
  if (faceCount > 1) {
    return {
      isValid: false,
      reasonCode: 'MULTIPLE_FACES',
      details: { faceCount },
    };
  }

  // We have exactly one face — run quality checks on it
  const face = detectionResults[0];
  const { landmarks, boundingBox } = face;

  // Check 3: Face too small (face width in pixels)
  const faceWidthPx = boundingBox.width * imageWidth;

  if (faceWidthPx < thresholds.minFaceWidthPx) {
    return {
      isValid: false,
      reasonCode: 'FACE_TOO_SMALL',
      details: {
        faceCount: 1,
        faceWidthPx,
      },
    };
  }

  // Check 4: Not frontal (symmetry ratio)
  const symmetryRatio = computeSymmetryRatio(landmarks, imageWidth);

  if (symmetryRatio < thresholds.minSymmetryRatio) {
    return {
      isValid: false,
      reasonCode: 'NOT_FRONTAL',
      details: {
        faceCount: 1,
        faceWidthPx,
        symmetryRatio,
      },
    };
  }

  // All checks passed
  return {
    isValid: true,
    details: {
      faceCount: 1,
      faceWidthPx,
      symmetryRatio,
    },
  };
}

// ---------------------------------------------------------------------------
// Symmetry ratio calculation
// ---------------------------------------------------------------------------

/**
 * Compute the facial symmetry ratio.
 *
 * Measures the distance from the nose midline to the left and right
 * face contour landmarks, then returns the ratio of the smaller to
 * the larger distance.
 *
 * A perfectly frontal face will have a ratio close to 1.0.
 * A face turned to the side will have a lower ratio.
 *
 * @param landmarks - Array of 468 normalized landmarks.
 * @param imageWidth - Image width in pixels (for denormalization).
 * @returns Symmetry ratio in range [0, 1].
 */
export function computeSymmetryRatio(
  landmarks: NormalizedLandmark[],
  imageWidth: number
): number {
  // Ensure we have enough landmarks
  if (
    landmarks.length <= Math.max(NOSE_MIDLINE, LEFT_CHEEK_CONTOUR, RIGHT_CHEEK_CONTOUR)
  ) {
    return 0;
  }

  const noseMidline = landmarks[NOSE_MIDLINE];
  const leftContour = landmarks[LEFT_CHEEK_CONTOUR];
  const rightContour = landmarks[RIGHT_CHEEK_CONTOUR];

  // Compute distances in pixel space for accuracy
  const leftHalfWidth = Math.abs(noseMidline.x - leftContour.x) * imageWidth;
  const rightHalfWidth = Math.abs(noseMidline.x - rightContour.x) * imageWidth;

  // Avoid division by zero
  const maxWidth = Math.max(leftHalfWidth, rightHalfWidth);
  if (maxWidth === 0) {
    return 0;
  }

  const minWidth = Math.min(leftHalfWidth, rightHalfWidth);
  return minWidth / maxWidth;
}
