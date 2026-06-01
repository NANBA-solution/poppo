import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@poppo/onboarding/v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'done';
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

/** オンボーディングとログイン画面を最初から */
export async function resetOnboardingFlow(): Promise<void> {
  await AsyncStorage.multiRemove([ONBOARDING_KEY, '@poppo/auth-welcome/v1']);
}
