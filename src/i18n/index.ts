/**
 * i18n Configuration — HairMatch
 *
 * Initializes react-i18next with English as the default language.
 * Architecture supports adding new languages by simply dropping a new
 * JSON file into /public/locales/ — no code changes required (CC-01).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * We inline the English translation to avoid an async fetch on first load.
 * For additional languages, use i18next-http-backend to load dynamically.
 */
async function loadTranslations(): Promise<Record<string, unknown>> {
  const response = await fetch('/locales/en.json');
  return response.json() as Promise<Record<string, unknown>>;
}

export async function initI18n(): Promise<typeof i18n> {
  const enTranslations = await loadTranslations();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslations,
        },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      // Support 40% text expansion for future translations (CC-01)
      react: {
        useSuspense: true,
      },
    });

  return i18n;
}

export default i18n;
