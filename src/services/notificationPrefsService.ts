import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@poppo/notifications/enabled/v1';

/** デフォルトはオフ（審査・UX: 起動直後に権限ダイアログを出さない） */
export async function getNotificationsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return raw === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}
