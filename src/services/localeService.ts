import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLocale = 'ja' | 'en';

const LOCALE_KEY = '@poppo/locale/v1';

export async function getSavedLocale(): Promise<AppLocale | null> {
  const raw = await AsyncStorage.getItem(LOCALE_KEY);
  if (raw === 'ja' || raw === 'en') return raw;
  return null;
}

export async function saveLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}
