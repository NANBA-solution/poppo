import { defaultI18nValue, I18nContext, type I18nContextValue } from '@/i18n/context';
import { en } from '@/i18n/locales/en';
import { ja, type TranslationTree } from '@/i18n/locales/ja';
import { getSavedLocale, saveLocale, type AppLocale } from '@/services/localeService';
import * as React from 'react';

const dictionaries: Record<AppLocale, TranslationTree> = { ja, en };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<AppLocale>('ja');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void getSavedLocale().then((saved) => {
      if (saved) setLocaleState(saved);
      setReady(true);
    });
  }, []);

  const setLocale = React.useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await saveLocale(next);
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      t: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  if (!ready) {
    return (
      <I18nContext.Provider value={defaultI18nValue}>{children}</I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (ctx) return ctx;

  if (__DEV__) {
    console.warn('[i18n] useI18n called outside I18nProvider — using ja fallback');
  }
  return defaultI18nValue;
}
