/**
 * Photo Validation Types — HairMatch (B1-03)
 *
 * Types for the photo validation gate that checks whether a photo
 * meets quality requirements before face shape classification.
 */

// ---------------------------------------------------------------------------
// Validation reason codes
// ---------------------------------------------------------------------------

/**
 * Reason codes for photo rejection.
 * Each maps to a user-facing i18n key in validation.{code}.
 */
export type ValidationReasonCode =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FACE_TOO_SMALL'
  | 'NOT_FRONTAL';

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

/** Result of photo validation. */
export interface ValidationResult {
  /** Whether the photo passed all validation checks. */
  isValid: boolean;

  /** Reason code for rejection (only set when isValid === false). */
  reasonCode?: ValidationReasonCode;

  /** Diagnostic details about the validation. */
  details?: ValidationDetails;
}

/** Diagnostic details returned with validation results. */
export interface ValidationDetails {
  /** Number of faces detected in the image. */
  faceCount: number;

  /** Width of the detected face in pixels (undefined if no face). */
  faceWidthPx?: number;

  /** Symmetry ratio (0 to 1, where 1 = perfectly symmetric). */
  symmetryRatio?: number;
}

// ---------------------------------------------------------------------------
// Validation thresholds
// ---------------------------------------------------------------------------

/** Configuration thresholds for photo validation. */
export interface ValidationThresholds {
  /** Minimum face width in pixels. Default: 150 */
  minFaceWidthPx: number;

  /** Minimum symmetry ratio (0 to 1). Default: 0.75 */
  minSymmetryRatio: number;
}

/** Default validation thresholds per PRD FR-02. */
export const DEFAULT_VALIDATION_THRESHOLDS: ValidationThresholds = {
  minFaceWidthPx: 150,
  minSymmetryRatio: 0.75,
};
