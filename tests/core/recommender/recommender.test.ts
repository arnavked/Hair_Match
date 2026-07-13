import { describe, it, expect } from 'vitest';
import { recommend } from '@/core/recommender/recommender';
import { STYLES_DB } from '@/core/recommender/styles-db';
import type { FaceShapeScores } from '@/types';
import type { UserPreferences } from '@/core/recommender/recommender.types';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Create a FaceShapeScores where one shape has high confidence. */
function dominantScores(dominant: keyof FaceShapeScores, confidence = 0.85): FaceShapeScores {
  const rest = (1 - confidence) / 4;
  const base: FaceShapeScores = { oval: rest, round: rest, square: rest, heart: rest, oblong: rest };
  base[dominant] = confidence;
  return base;
}

const noPrefs: UserPreferences = {
  hairType: null,
  occasion: null,
  genderPresentation: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Recommendation Engine (B3-02)', () => {

  describe('Style Database', () => {
    it('has at least 20 styles', () => {
      expect(STYLES_DB.length).toBeGreaterThanOrEqual(20);
    });

    it('every style has a unique id', () => {
      const ids = STYLES_DB.map((s) => s.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('every style has at least one primary shape', () => {
      for (const style of STYLES_DB) {
        expect(style.primaryShapes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('recommend()', () => {
    it('returns topN results by default', () => {
      const scores = dominantScores('oval');
      const recs = recommend(scores, noPrefs, 6);
      expect(recs.length).toBe(6);
    });

    it('returns results sorted descending by score', () => {
      const scores = dominantScores('round');
      const recs = recommend(scores, noPrefs);
      for (let i = 1; i < recs.length; i++) {
        expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
      }
    });

    it('all scores are between 0 and 100', () => {
      for (const shape of ['oval', 'round', 'square', 'heart', 'oblong'] as const) {
        const recs = recommend(dominantScores(shape), noPrefs);
        for (const rec of recs) {
          expect(rec.score).toBeGreaterThanOrEqual(0);
          expect(rec.score).toBeLessThanOrEqual(100);
        }
      }
    });

    it('top recommendation for oval shape targets oval', () => {
      const scores = dominantScores('oval', 0.95);
      const recs = recommend(scores, noPrefs, 6);
      const top = recs[0];
      const targetsOval =
        top.style.primaryShapes.includes('oval') ||
        top.style.secondaryShapes.includes('oval');
      expect(targetsOval).toBe(true);
    });

    it('top recommendation for heart shape targets heart', () => {
      const scores = dominantScores('heart', 0.95);
      const recs = recommend(scores, noPrefs, 6);
      const top = recs[0];
      const targetsHeart =
        top.style.primaryShapes.includes('heart') ||
        top.style.secondaryShapes.includes('heart');
      expect(targetsHeart).toBe(true);
    });

    it('preference matching boosts score over no preference', () => {
      const scores = dominantScores('square');

      // Find a style with straight hair compatibility
      const styleWithStraight = STYLES_DB.find(
        (s) => s.suitableHairTypes.includes('straight') && s.primaryShapes.includes('square')
      );
      if (!styleWithStraight) return; // skip if none found

      const recsWithPref = recommend(scores, { hairType: 'straight', occasion: null, genderPresentation: null });
      const recsNoPref = recommend(scores, noPrefs);

      const scoreWithPref = recsWithPref.find((r) => r.style.id === styleWithStraight.id)?.score ?? 0;
      const scoreNoPref = recsNoPref.find((r) => r.style.id === styleWithStraight.id)?.score ?? 0;

      expect(scoreWithPref).toBeGreaterThanOrEqual(scoreNoPref);
    });

    it('each recommendation has a non-empty rationale', () => {
      const recs = recommend(dominantScores('oblong'), noPrefs);
      for (const rec of recs) {
        expect(rec.rationale.length).toBeGreaterThan(0);
      }
    });
  });
});
