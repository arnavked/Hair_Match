/**
 * Recommendation Engine — HairMatch (B3-02)
 *
 * Scores all styles in the database against:
 *  - Face shape scores (from classifier)
 *  - User preferences (hair type, occasion, gender)
 *
 * Scoring model:
 *  base_score    = 2.0 × score[primaryShape]  +  1.0 × score[secondaryShape]
 *  pref_boost    = +0.3 per matched preference (hair, occasion, gender)
 *  final_score   = clamp((base_score + pref_boost) × 100, 0, 100)
 *
 * Returns top N styles sorted by score descending.
 */

import type { FaceShapeScores } from '../../types';
import type { StyleEntry, ScoredRecommendation, UserPreferences } from './recommender.types';
import { STYLES_DB } from './styles-db';

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Generate hairstyle recommendations for a user.
 *
 * @param shapeScores - Softmax classifier output (sums to ~1.0).
 * @param preferences - User-selected preferences from the form.
 * @param topN - Number of top recommendations to return (default: 6).
 * @returns Array of ScoredRecommendation, highest score first.
 */
export function recommend(
  shapeScores: FaceShapeScores,
  preferences: UserPreferences,
  topN = 6
): ScoredRecommendation[] {
  const scored = STYLES_DB.map((style) =>
    scoreStyle(style, shapeScores, preferences)
  );

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreStyle(
  style: StyleEntry,
  shapeScores: FaceShapeScores,
  prefs: UserPreferences
): ScoredRecommendation {
  // --- Face shape contribution ---
  let shapeScore = 0;

  for (const shape of style.primaryShapes) {
    shapeScore += 2.0 * (shapeScores[shape] ?? 0);
  }
  for (const shape of style.secondaryShapes) {
    shapeScore += 1.0 * (shapeScores[shape] ?? 0);
  }

  // Normalize: max possible for a single shape style with 2× weight
  // is 2.0 (when score=1.0 for that shape). We map to [0, 1].
  const maxShapeScore = 2.0 * style.primaryShapes.length + 1.0 * style.secondaryShapes.length;
  const normalizedShape = maxShapeScore > 0 ? shapeScore / maxShapeScore : 0;

  // --- Preference boosts ---
  let prefBoost = 0;
  const boostPerMatch = 0.15;

  if (prefs.hairType !== null) {
    const suitableAll = style.suitableHairTypes.length === 0;
    if (suitableAll || style.suitableHairTypes.includes(prefs.hairType)) {
      prefBoost += boostPerMatch;
    } else {
      prefBoost -= boostPerMatch; // Penalize mismatch
    }
  }

  if (prefs.occasion !== null) {
    const suitableAll = style.suitableOccasions.length === 0;
    if (suitableAll || style.suitableOccasions.includes(prefs.occasion)) {
      prefBoost += boostPerMatch;
    } else {
      prefBoost -= boostPerMatch;
    }
  }

  if (prefs.genderPresentation !== null) {
    const suitableAll = style.genderPresentations.length === 0;
    if (suitableAll || style.genderPresentations.includes(prefs.genderPresentation)) {
      prefBoost += boostPerMatch;
    } else {
      prefBoost -= boostPerMatch;
    }
  }

  // --- Final score ---
  const rawScore = normalizedShape + prefBoost;
  const score = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

  // --- Rationale ---
  const rationale = buildRationale(style, shapeScores, prefs);

  return { style, score, rationale };
}

/**
 * Build a short explanation of why this style was recommended.
 */
function buildRationale(
  style: StyleEntry,
  shapeScores: FaceShapeScores,
  prefs: UserPreferences
): string {
  // Find the dominant shape the style targets
  const dominantMatch = style.primaryShapes.reduce(
    (best, shape) =>
      (shapeScores[shape] ?? 0) > (shapeScores[best] ?? 0) ? shape : best,
    style.primaryShapes[0]
  );

  const confidence = Math.round((shapeScores[dominantMatch] ?? 0) * 100);
  const parts: string[] = [
    `Recommended for ${dominantMatch} face shapes (${confidence}% match).`,
  ];

  if (prefs.hairType && style.suitableHairTypes.includes(prefs.hairType)) {
    parts.push(`Works well with ${prefs.hairType} hair.`);
  }
  if (prefs.occasion && style.suitableOccasions.includes(prefs.occasion)) {
    parts.push(`Great for ${prefs.occasion} occasions.`);
  }

  return parts.join(' ');
}
