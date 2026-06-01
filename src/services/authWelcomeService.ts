import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_WELCOME_KEY = '@poppo/auth-welcome/v1';

export async function hasCompletedAuthWelcome(): Promise<boolean> {
  const value = await AsyncStorage.getItem(AUTH_WELCOME_KEY);
  return value === 'done';
}

export async function completeAuthWelcome(): Promise<void> {
  await AsyncStorage.setItem(AUTH_WELCOME_KEY, 'done');
}

export async function resetAuthWelcome(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_WELCOME_KEY);
}
