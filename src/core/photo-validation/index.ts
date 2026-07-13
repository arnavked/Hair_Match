/**
 * Photo Validation Barrel Export — HairMatch
 */

export { validatePhoto, computeSymmetryRatio } from './photo-validation';
export type {
  ValidationResult,
  ValidationReasonCode,
  ValidationDetails,
  ValidationThresholds,
} from './photo-validation.types';
export { DEFAULT_VALIDATION_THRESHOLDS } from './photo-validation.types';
