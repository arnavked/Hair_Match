/**
 * Recommendation Engine Types — HairMatch (B3)
 */

import type { FaceShape, HairType, Occasion, GenderPresentation } from '../../types';

// ---------------------------------------------------------------------------
// Style Entry
// ---------------------------------------------------------------------------

/** A single hairstyle in the database. */
export interface StyleEntry {
  /** Unique slug, used as i18n key and asset key. e.g. "classic-bob" */
  id: string;

  /** Display name. */
  name: string;

  /** Short description. */
  description: string;

  /**
   * Face shapes this style flatters.
   * Primary shapes (score ×2) vs secondary shapes (score ×1).
   */
  primaryShapes: FaceShape[];
  secondaryShapes: FaceShape[];

  /** Hair types this style suits. Empty = all types. */
  suitableHairTypes: HairType[];

  /** Occasions this style fits. Empty = all occasions. */
  suitableOccasions: Occasion[];

  /** Gender presentations this style suits. Empty = all. */
  genderPresentations: GenderPresentation[];

  /** Relative path to the style illustration image under /assets/styles/. */
  imagePath: string;

  /** Tags for filtering. */
  tags: string[];
}

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------

/** A scored recommendation returned to the user. */
export interface ScoredRecommendation {
  style: StyleEntry;
  /** 0–100 match score. */
  score: number;
  /** Human-readable explanation of why this style suits the user. */
  rationale: string;
}

/** User preferences collected from the input form. */
export interface UserPreferences {
  hairType: HairType | null;
  occasion: Occasion | null;
  genderPresentation: GenderPresentation | null;
}
