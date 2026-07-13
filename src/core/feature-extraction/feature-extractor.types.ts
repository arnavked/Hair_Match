/**
 * Feature Extraction Types — HairMatch (B2-01)
 *
 * Types for the geometric feature extractor that computes
 * 18 scale-invariant measurements from 468 facial landmarks.
 */

// ---------------------------------------------------------------------------
// Feature vector
// ---------------------------------------------------------------------------

/**
 * 18-element geometric feature vector extracted from facial landmarks.
 * All values are scale-invariant (normalized by face width or face height).
 */
export interface GeometricFeatures {
  /** 18-element Float32Array of feature values, ordered by FEATURE_NAMES. */
  values: Float32Array;

  /** Human-readable feature names in the same order as values. */
  names: readonly string[];

  /** Named access to individual features for debugging and rules. */
  named: NamedFeatures;
}

/**
 * Named access to each individual geometric feature.
 * This provides readable access vs. positional indexing.
 */
export interface NamedFeatures {
  /** Face height / face width — primary aspect ratio. ~1.5 for oval. */
  faceHeightToWidthRatio: number;

  /** Forehead width / face width. */
  foreheadWidthRatio: number;

  /** Jaw width / face width. */
  jawWidthRatio: number;

  /** Cheekbone width / face width. */
  cheekboneWidthRatio: number;

  /** Forehead width / jaw width — taper indicator. >1.2 for heart. */
  foreheadToJawRatio: number;

  /** Forehead width / cheekbone width — upper face proportion. */
  foreheadToCheekRatio: number;

  /** Jaw width / cheekbone width — lower face proportion. */
  jawToCheekRatio: number;

  /** Left jaw angle in radians — jaw angularity. */
  jawAngleLeft: number;

  /** Right jaw angle in radians — jaw angularity (symmetry). */
  jawAngleRight: number;

  /** Chin-to-jawmid avg distance / face width — chin prominence. */
  chinToJawRatio: number;

  /** Forehead(10)→NoseBridge(6) / face height — forehead vertical proportion. */
  foreheadHeight: number;

  /** NoseBridge(6)→NoseTip(4) / face height — midface proportion. */
  midFaceHeight: number;

  /** NoseTip(4)→Chin(152) / face height — lower face proportion. */
  lowerFaceHeight: number;

  /** 4π × area / perimeter² of face oval — how round the outline is (1.0 = circle). */
  faceCircularity: number;

  /** Average angle along jawline contour points — jawline smoothness. */
  jawlineContourAngle: number;

  /** (temple width − jaw width) / face width — overall taper. */
  templeToJawTaper: number;

  /** Cheek contour deviation from straight line / face width — cheek roundness. */
  cheekFullness: number;

  /** Left/right distance symmetry ratio — 1.0 = perfectly symmetric. */
  facialSymmetry: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Ordered feature names matching the Float32Array positions.
 * This ordering is the contract between feature extraction, training, and inference.
 */
export const FEATURE_NAMES = [
  'faceHeightToWidthRatio',
  'foreheadWidthRatio',
  'jawWidthRatio',
  'cheekboneWidthRatio',
  'foreheadToJawRatio',
  'foreheadToCheekRatio',
  'jawToCheekRatio',
  'jawAngleLeft',
  'jawAngleRight',
  'chinToJawRatio',
  'foreheadHeight',
  'midFaceHeight',
  'lowerFaceHeight',
  'faceCircularity',
  'jawlineContourAngle',
  'templeToJawTaper',
  'cheekFullness',
  'facialSymmetry',
] as const;

/** Number of features in the vector. */
export const NUM_FEATURES = FEATURE_NAMES.length; // 18
