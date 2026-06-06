import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ONBOARDING_KEY = '@poppo/onboarding/v1';
const ONBOARDING_RELEASE_KEY = '@poppo/onboarding/seen-release';

/** インストール／アップデート単位でオンボーディング表示を判定するリリース ID */
export function getCurrentAppRelease(): string {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const build = Constants.nativeBuildVersion ?? '0';
  return `${version}+${build}`;
}

/** このリリースでまだオンボーディングを完了していない */
export async function shouldShowOnboarding(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(ONBOARDING_RELEASE_KEY);
  return seen !== getCurrentAppRelease();
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return !(await shouldShowOnboarding());
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_RELEASE_KEY, getCurrentAppRelease());
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([ONBOARDING_RELEASE_KEY, ONBOARDING_KEY]);
}

/** オンボーディングを最初から */
export async function resetOnboardingFlow(): Promise<void> {
  await resetOnboarding();
}
