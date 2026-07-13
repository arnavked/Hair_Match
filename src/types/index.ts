/**
 * HairMatch — Shared Type Definitions
 *
 * Central type exports consumed across the entire project.
 * All domain types are defined here so that modules stay loosely coupled.
 */

// ---------------------------------------------------------------------------
// Face Shape
// ---------------------------------------------------------------------------

/** The five face shape categories the system classifies into. */
export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong';

/** All face shape values as a constant array (useful for iteration & validation). */
export const FACE_SHAPES: readonly FaceShape[] = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
] as const;

// ---------------------------------------------------------------------------
// User Input Options
// ---------------------------------------------------------------------------

/** Hair type options presented to the user. */
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';

export const HAIR_TYPES: readonly HairType[] = [
  'straight',
  'wavy',
  'curly',
  'coily',
] as const;

/** Occasion options for personalizing recommendations. */
export type Occasion = 'everyday' | 'professional' | 'formal';

export const OCCASIONS: readonly Occasion[] = [
  'everyday',
  'professional',
  'formal',
] as const;

/** Gender presentation options (inclusive, not binary). */
export type GenderPresentation = 'masculine' | 'feminine' | 'androgynous';

export const GENDER_PRESENTATIONS: readonly GenderPresentation[] = [
  'masculine',
  'feminine',
  'androgynous',
] as const;

// ---------------------------------------------------------------------------
// Face Shape Scores (classifier output)
// ---------------------------------------------------------------------------

/**
 * Classifier output: confidence score for each face shape.
 * Values are softmax probabilities that sum to ~1.0.
 */
export type FaceShapeScores = Record<FaceShape, number>;

// ---------------------------------------------------------------------------
// Recommendation Types (defined early for cross-module consumption)
// ---------------------------------------------------------------------------

/** Input to the recommendation engine. */
export interface RecommendationInput {
  shapeScores: FaceShapeScores;
  hairType: HairType | null;
  occasion: Occasion | null;
  genderPresentation: GenderPresentation | null;
}

/** A single style recommendation returned by the engine. */
export interface StyleRecommendation {
  id: string;
  name: string;
  description: string;
  score: number;
  rationale: string;
  assetKey: string;
}

/** Output from the recommendation engine. */
export interface RecommendationOutput {
  styles: StyleRecommendation[];
}
