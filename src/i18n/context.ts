import { ja, type TranslationTree } from '@/i18n/locales/ja';
import type { AppLocale } from '@/services/localeService';
import * as React from 'react';

export type I18nContextValue = {
  locale: AppLocale;
  t: TranslationTree;
  setLocale: (locale: AppLocale) => Promise<void>;
};

export const defaultI18nValue: I18nContextValue = {
  locale: 'ja',
  t: ja,
  setLocale: async () => undefined,
};

export const I18nContext = React.createContext<I18nContextValue | null>(null);
