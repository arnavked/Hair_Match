/**
 * Landmark Indices — HairMatch
 *
 * Named constants for key MediaPipe Face Mesh landmark indices.
 * Based on the 468-point face mesh topology.
 *
 * Reference: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */

// ---------------------------------------------------------------------------
// Core anchor points (used for overlay positioning in B5)
// ---------------------------------------------------------------------------

/** Top center of forehead */
export const FOREHEAD_CENTER = 10;

/** Bottom center of chin */
export const CHIN = 152;

/** Left temple (user's left, viewer's right) */
export const LEFT_TEMPLE = 21;

/** Right temple (user's right, viewer's left) */
export const RIGHT_TEMPLE = 251;

// ---------------------------------------------------------------------------
// Face width measurement points
// ---------------------------------------------------------------------------

/** Left cheek / face contour — widest point */
export const LEFT_CHEEK_CONTOUR = 234;

/** Right cheek / face contour — widest point */
export const RIGHT_CHEEK_CONTOUR = 454;

// ---------------------------------------------------------------------------
// Nose landmarks (used for symmetry measurement)
// ---------------------------------------------------------------------------

/** Tip of the nose */
export const NOSE_TIP = 4;

/** Top of the nose bridge (between eyes) */
export const NOSE_BRIDGE = 6;

/** Nose midline — used for symmetry ratio calculation (B1-03) */
export const NOSE_MIDLINE = 1;

// ---------------------------------------------------------------------------
// Jaw landmarks (used for face shape classification in B2)
// ---------------------------------------------------------------------------

/** Left jaw angle (near ear) */
export const LEFT_JAW_ANGLE = 172;

/** Right jaw angle (near ear) */
export const RIGHT_JAW_ANGLE = 397;

/** Left jaw point (mid-jaw) */
export const LEFT_JAW_MID = 136;

/** Right jaw point (mid-jaw) */
export const RIGHT_JAW_MID = 365;

// ---------------------------------------------------------------------------
// Forehead width measurement points
// ---------------------------------------------------------------------------

/** Left forehead edge */
export const LEFT_FOREHEAD = 67;

/** Right forehead edge */
export const RIGHT_FOREHEAD = 297;

// ---------------------------------------------------------------------------
// Cheekbone landmarks
// ---------------------------------------------------------------------------

/** Left cheekbone (high point) */
export const LEFT_CHEEKBONE = 123;

/** Right cheekbone (high point) */
export const RIGHT_CHEEKBONE = 352;

// ---------------------------------------------------------------------------
// Eye landmarks (used for face measurements)
// ---------------------------------------------------------------------------

/** Left eye outer corner */
export const LEFT_EYE_OUTER = 33;

/** Left eye inner corner */
export const LEFT_EYE_INNER = 133;

/** Right eye outer corner */
export const RIGHT_EYE_OUTER = 263;

/** Right eye inner corner */
export const RIGHT_EYE_INNER = 362;

// ---------------------------------------------------------------------------
// Eyebrow landmarks
// ---------------------------------------------------------------------------

/** Left eyebrow outer */
export const LEFT_EYEBROW_OUTER = 46;

/** Left eyebrow inner */
export const LEFT_EYEBROW_INNER = 105;

/** Right eyebrow outer */
export const RIGHT_EYEBROW_OUTER = 276;

/** Right eyebrow inner */
export const RIGHT_EYEBROW_INNER = 334;

// ---------------------------------------------------------------------------
// Face contour — full outline for shape analysis
// ---------------------------------------------------------------------------

/**
 * Jawline contour indices from left ear to chin to right ear.
 * Ordered left-to-right as viewed by the camera.
 */
export const JAWLINE_CONTOUR = [
  234, 127, 162, 21, 54, 103, 67, 109, 10, // Left side (forehead to top)
  338, 297, 332, 284, 251, 389, 356, 454,   // Right side (top to forehead)
] as const;

/**
 * Face oval contour — complete outline following the face boundary.
 * Used for face shape classification feature extraction.
 */
export const FACE_OVAL_CONTOUR = [
  10, 338, 297, 332, 284, 251, 389, 356, 454,
  323, 361, 288, 397, 365, 379, 378, 400, 377,
  152, 148, 176, 149, 150, 136, 172, 58, 132,
  93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
] as const;

// ---------------------------------------------------------------------------
// Key landmark sets for debug overlay (B1-05)
// ---------------------------------------------------------------------------

/**
 * Key landmarks highlighted in a different color in the debug overlay.
 * These are the most important landmarks for face shape analysis.
 */
export const KEY_LANDMARKS = [
  FOREHEAD_CENTER,
  CHIN,
  LEFT_TEMPLE,
  RIGHT_TEMPLE,
  LEFT_CHEEK_CONTOUR,
  RIGHT_CHEEK_CONTOUR,
  NOSE_TIP,
  NOSE_BRIDGE,
  NOSE_MIDLINE,
  LEFT_JAW_ANGLE,
  RIGHT_JAW_ANGLE,
  LEFT_FOREHEAD,
  RIGHT_FOREHEAD,
  LEFT_CHEEKBONE,
  RIGHT_CHEEKBONE,
] as const;
