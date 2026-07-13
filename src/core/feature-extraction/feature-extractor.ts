/**
 * Feature Extractor — HairMatch (B2-01)
 *
 * Computes 18 scale-invariant geometric features from 468 MediaPipe
 * facial landmarks. All features are normalized by face width or face
 * height so they are independent of image resolution and face distance.
 *
 * Feature order matches FEATURE_NAMES and is the contract for both
 * the rules-based classifier and the ONNX ML model.
 */

import type { NormalizedLandmark } from '../face-detection/face-detection.types';
import * as LM from '../face-detection/landmark-indices';
import type { GeometricFeatures, NamedFeatures } from './feature-extractor.types';
import { FEATURE_NAMES } from './feature-extractor.types';

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

/**
 * Extract 18 geometric features from facial landmarks.
 *
 * @param landmarks - Array of 468 normalized landmarks from MediaPipe.
 * @returns GeometricFeatures with Float32Array values and named access.
 * @throws Error if landmarks array has fewer than 468 points.
 */
export function extractFeatures(landmarks: NormalizedLandmark[]): GeometricFeatures {
  if (landmarks.length < 468) {
    throw new Error(
      `Expected 468 landmarks, got ${landmarks.length}`
    );
  }

  // -----------------------------------------------------------------------
  // 1. Core measurements (raw, normalized coordinates)
  // -----------------------------------------------------------------------

  // Face width: left cheek contour to right cheek contour
  const faceWidth = dist(landmarks[LM.LEFT_CHEEK_CONTOUR], landmarks[LM.RIGHT_CHEEK_CONTOUR]);

  // Face height: forehead center to chin
  const faceHeight = dist(landmarks[LM.FOREHEAD_CENTER], landmarks[LM.CHIN]);

  // Guard against degenerate cases
  const safeWidth = Math.max(faceWidth, 1e-6);
  const safeHeight = Math.max(faceHeight, 1e-6);

  // Forehead width
  const foreheadWidth = dist(landmarks[LM.LEFT_FOREHEAD], landmarks[LM.RIGHT_FOREHEAD]);

  // Jaw width (at jaw angle)
  const jawWidth = dist(landmarks[LM.LEFT_JAW_ANGLE], landmarks[LM.RIGHT_JAW_ANGLE]);

  // Cheekbone width
  const cheekboneWidth = dist(landmarks[LM.LEFT_CHEEKBONE], landmarks[LM.RIGHT_CHEEKBONE]);

  // Temple width (at temples)
  const templeWidth = dist(landmarks[LM.LEFT_TEMPLE], landmarks[LM.RIGHT_TEMPLE]);

  // -----------------------------------------------------------------------
  // 2. Compute each feature
  // -----------------------------------------------------------------------

  // F1: Face height to width ratio
  const faceHeightToWidthRatio = faceHeight / safeWidth;

  // F2: Forehead width ratio (relative to face width)
  const foreheadWidthRatio = foreheadWidth / safeWidth;

  // F3: Jaw width ratio
  const jawWidthRatio = jawWidth / safeWidth;

  // F4: Cheekbone width ratio
  const cheekboneWidthRatio = cheekboneWidth / safeWidth;

  // F5: Forehead to jaw ratio (taper)
  const safeJaw = Math.max(jawWidth, 1e-6);
  const foreheadToJawRatio = foreheadWidth / safeJaw;

  // F6: Forehead to cheek ratio
  const safeCheek = Math.max(cheekboneWidth, 1e-6);
  const foreheadToCheekRatio = foreheadWidth / safeCheek;

  // F7: Jaw to cheek ratio
  const jawToCheekRatio = jawWidth / safeCheek;

  // F8: Left jaw angle (angle at left jaw mid-point)
  const jawAngleLeft = computeAngle(
    landmarks[LM.LEFT_JAW_ANGLE],
    landmarks[LM.LEFT_JAW_MID],
    landmarks[LM.CHIN]
  );

  // F9: Right jaw angle
  const jawAngleRight = computeAngle(
    landmarks[LM.RIGHT_JAW_ANGLE],
    landmarks[LM.RIGHT_JAW_MID],
    landmarks[LM.CHIN]
  );

  // F10: Chin to jaw ratio
  const chinToJawLeft = dist(landmarks[LM.CHIN], landmarks[LM.LEFT_JAW_MID]);
  const chinToJawRight = dist(landmarks[LM.CHIN], landmarks[LM.RIGHT_JAW_MID]);
  const chinToJawRatio = ((chinToJawLeft + chinToJawRight) / 2) / safeWidth;

  // F11: Forehead height proportion
  const foreheadHeight = dist(landmarks[LM.FOREHEAD_CENTER], landmarks[LM.NOSE_BRIDGE]) / safeHeight;

  // F12: Mid-face height proportion
  const midFaceHeight = dist(landmarks[LM.NOSE_BRIDGE], landmarks[LM.NOSE_TIP]) / safeHeight;

  // F13: Lower face height proportion
  const lowerFaceHeight = dist(landmarks[LM.NOSE_TIP], landmarks[LM.CHIN]) / safeHeight;

  // F14: Face circularity (4π × area / perimeter²)
  const faceCircularity = computeCircularity(landmarks, LM.FACE_OVAL_CONTOUR);

  // F15: Jawline contour angle (average angle along jawline)
  const jawlineContourAngle = computeAverageContourAngle(landmarks, LM.JAWLINE_CONTOUR);

  // F16: Temple to jaw taper
  const templeToJawTaper = (templeWidth - jawWidth) / safeWidth;

  // F17: Cheek fullness
  const cheekFullness = computeCheekFullness(landmarks, safeWidth);

  // F18: Facial symmetry
  const facialSymmetry = computeFacialSymmetry(landmarks);

  // -----------------------------------------------------------------------
  // 3. Pack into NamedFeatures and Float32Array
  // -----------------------------------------------------------------------

  const named: NamedFeatures = {
    faceHeightToWidthRatio,
    foreheadWidthRatio,
    jawWidthRatio,
    cheekboneWidthRatio,
    foreheadToJawRatio,
    foreheadToCheekRatio,
    jawToCheekRatio,
    jawAngleLeft,
    jawAngleRight,
    chinToJawRatio,
    foreheadHeight,
    midFaceHeight,
    lowerFaceHeight,
    faceCircularity,
    jawlineContourAngle,
    templeToJawTaper,
    cheekFullness,
    facialSymmetry,
  };

  const values = new Float32Array([
    faceHeightToWidthRatio,
    foreheadWidthRatio,
    jawWidthRatio,
    cheekboneWidthRatio,
    foreheadToJawRatio,
    foreheadToCheekRatio,
    jawToCheekRatio,
    jawAngleLeft,
    jawAngleRight,
    chinToJawRatio,
    foreheadHeight,
    midFaceHeight,
    lowerFaceHeight,
    faceCircularity,
    jawlineContourAngle,
    templeToJawTaper,
    cheekFullness,
    facialSymmetry,
  ]);

  return {
    values,
    names: FEATURE_NAMES,
    named,
  };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Euclidean distance between two normalized landmarks (2D, ignoring z). */
function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute the angle (in radians) at point B, formed by vectors BA and BC.
 * Returns a value in [0, π].
 */
function computeAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  const denom = magBA * magBC;
  if (denom < 1e-10) return 0;

  // Clamp to [-1, 1] to avoid NaN from acos
  const cosAngle = Math.max(-1, Math.min(1, dot / denom));
  return Math.acos(cosAngle);
}

/**
 * Compute circularity of a contour: 4π × area / perimeter².
 * A perfect circle has circularity = 1.0.
 */
function computeCircularity(
  landmarks: NormalizedLandmark[],
  contourIndices: readonly number[]
): number {
  const points = contourIndices.map((i) => landmarks[i]);
  const n = points.length;
  if (n < 3) return 0;

  // Shoelace formula for polygon area
  let area = 0;
  let perimeter = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
    perimeter += dist(points[i], points[j]);
  }

  area = Math.abs(area) / 2;
  const safePeri = Math.max(perimeter, 1e-10);

  return (4 * Math.PI * area) / (safePeri * safePeri);
}

/**
 * Compute the average angle along a contour (measures smoothness).
 * Lower values = sharper angles (more angular jaw).
 * Higher values = smoother curves (rounder jaw).
 */
function computeAverageContourAngle(
  landmarks: NormalizedLandmark[],
  contourIndices: readonly number[]
): number {
  const points = contourIndices.map((i) => landmarks[i]);
  const n = points.length;
  if (n < 3) return Math.PI;

  let totalAngle = 0;
  let count = 0;

  for (let i = 1; i < n - 1; i++) {
    totalAngle += computeAngle(points[i - 1], points[i], points[i + 1]);
    count++;
  }

  return count > 0 ? totalAngle / count : Math.PI;
}

/**
 * Compute cheek fullness — how much the cheeks bulge outward
 * compared to a straight line from temple to jaw.
 *
 * Measures the perpendicular deviation of the cheekbone from
 * the temple-to-jaw line, normalized by face width.
 */
function computeCheekFullness(
  landmarks: NormalizedLandmark[],
  safeWidth: number
): number {
  // Left side: deviation of left cheekbone from left temple→left jaw line
  const leftDev = pointToLineDistance(
    landmarks[LM.LEFT_CHEEKBONE],
    landmarks[LM.LEFT_TEMPLE],
    landmarks[LM.LEFT_JAW_ANGLE]
  );

  // Right side: deviation of right cheekbone from right temple→right jaw line
  const rightDev = pointToLineDistance(
    landmarks[LM.RIGHT_CHEEKBONE],
    landmarks[LM.RIGHT_TEMPLE],
    landmarks[LM.RIGHT_JAW_ANGLE]
  );

  return ((leftDev + rightDev) / 2) / safeWidth;
}

/**
 * Perpendicular distance from point P to the line defined by A→B.
 */
function pointToLineDistance(
  p: NormalizedLandmark,
  a: NormalizedLandmark,
  b: NormalizedLandmark
): number {
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const abLen = Math.sqrt(abX * abX + abY * abY);

  if (abLen < 1e-10) return dist(p, a);

  // Cross product magnitude gives area of parallelogram;
  // divide by base length to get height (perpendicular distance)
  const cross = Math.abs((p.x - a.x) * abY - (p.y - a.y) * abX);
  return cross / abLen;
}

/**
 * Compute facial symmetry as the ratio of left/right distances.
 * Compares multiple paired landmarks and returns the average ratio
 * (min/max), so 1.0 = perfectly symmetric.
 */
function computeFacialSymmetry(landmarks: NormalizedLandmark[]): number {
  const noseMidline = landmarks[LM.NOSE_MIDLINE];

  const pairs: [number, number][] = [
    [LM.LEFT_CHEEK_CONTOUR, LM.RIGHT_CHEEK_CONTOUR],
    [LM.LEFT_TEMPLE, LM.RIGHT_TEMPLE],
    [LM.LEFT_JAW_ANGLE, LM.RIGHT_JAW_ANGLE],
    [LM.LEFT_CHEEKBONE, LM.RIGHT_CHEEKBONE],
    [LM.LEFT_FOREHEAD, LM.RIGHT_FOREHEAD],
    [LM.LEFT_EYE_OUTER, LM.RIGHT_EYE_OUTER],
  ];

  let totalRatio = 0;
  let count = 0;

  for (const [leftIdx, rightIdx] of pairs) {
    const leftDist = dist(noseMidline, landmarks[leftIdx]);
    const rightDist = dist(noseMidline, landmarks[rightIdx]);

    const maxDist = Math.max(leftDist, rightDist);
    if (maxDist < 1e-10) continue;

    const minDist = Math.min(leftDist, rightDist);
    totalRatio += minDist / maxDist;
    count++;
  }

  return count > 0 ? totalRatio / count : 0;
}
