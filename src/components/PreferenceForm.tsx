/**
 * PreferenceForm — HairMatch (B3-03)
 *
 * Three-step chip selector for hair type, occasion, and gender presentation.
 * All selections are optional; users can skip directly to results.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HairType, Occasion, GenderPresentation } from '@/types';
import { HAIR_TYPES, OCCASIONS, GENDER_PRESENTATIONS } from '@/types';
import type { UserPreferences } from '@/core/recommender';

interface PreferenceFormProps {
  onSubmit: (prefs: UserPreferences) => void;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const HAIR_TYPE_ICONS: Record<HairType, string> = {
  straight: '〰️',
  wavy: '〜',
  curly: '🌀',
  coily: '⭕',
};

const OCCASION_ICONS: Record<Occasion, string> = {
  everyday: '☀️',
  professional: '💼',
  formal: '✨',
};

const GENDER_ICONS: Record<GenderPresentation, string> = {
  masculine: '▲',
  feminine: '♡',
  androgynous: '◈',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PreferenceForm({ onSubmit }: PreferenceFormProps) {
  const { t } = useTranslation();

  const [hairType, setHairType] = useState<HairType | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [genderPresentation, setGenderPresentation] = useState<GenderPresentation | null>(null);

  const handleSubmit = () => {
    onSubmit({ hairType, occasion, genderPresentation });
  };

  return (
    <div className="pref-form" id="preference-form">
      <div className="pref-header">
        <h2 className="pref-title">{t('inputForm.title')}</h2>
        <p className="pref-subtitle">{t('inputForm.subtitle')}</p>
      </div>

      {/* Hair Type */}
      <div className="pref-section">
        <p className="pref-label">{t('inputForm.hairType.label')}</p>
        <div className="chip-group" role="group" aria-label={t('inputForm.hairType.label')}>
          {HAIR_TYPES.map((type) => (
            <button
              key={type}
              id={`chip-hair-${type}`}
              className={`chip ${hairType === type ? 'chip-active' : ''}`}
              onClick={() => setHairType(hairType === type ? null : type)}
              aria-pressed={hairType === type}
            >
              <span className="chip-icon">{HAIR_TYPE_ICONS[type]}</span>
              <span>{t(`inputForm.hairType.${type}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div className="pref-section">
        <p className="pref-label">{t('inputForm.occasion.label')}</p>
        <div className="chip-group" role="group" aria-label={t('inputForm.occasion.label')}>
          {OCCASIONS.map((occ) => (
            <button
              key={occ}
              id={`chip-occasion-${occ}`}
              className={`chip ${occasion === occ ? 'chip-active' : ''}`}
              onClick={() => setOccasion(occasion === occ ? null : occ)}
              aria-pressed={occasion === occ}
            >
              <span className="chip-icon">{OCCASION_ICONS[occ]}</span>
              <span>{t(`inputForm.occasion.${occ}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gender Presentation */}
      <div className="pref-section">
        <p className="pref-label">{t('inputForm.genderPresentation.label')}</p>
        <div className="chip-group" role="group" aria-label={t('inputForm.genderPresentation.label')}>
          {GENDER_PRESENTATIONS.map((g) => (
            <button
              key={g}
              id={`chip-gender-${g}`}
              className={`chip ${genderPresentation === g ? 'chip-active' : ''}`}
              onClick={() => setGenderPresentation(genderPresentation === g ? null : g)}
              aria-pressed={genderPresentation === g}
            >
              <span className="chip-icon">{GENDER_ICONS[g]}</span>
              <span>{t(`inputForm.genderPresentation.${g}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="pref-actions">
        <button
          id="btn-show-styles"
          className="btn btn-primary btn-large"
          onClick={handleSubmit}
        >
          {t('inputForm.showStyles')} ✨
        </button>
        <button
          id="btn-skip-prefs"
          className="btn btn-ghost"
          onClick={handleSubmit}
        >
          {t('common.skip')}
        </button>
      </div>
    </div>
  );
}
