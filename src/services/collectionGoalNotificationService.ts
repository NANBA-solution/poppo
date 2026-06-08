import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import { ensureNotificationsReady } from '@/services/dailyNotificationService';
import { Platform } from 'react-native';

const GOAL_ANDROID_CHANNEL_ID = 'poppo-goal';

async function ensureGoalAndroidChannel(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(GOAL_ANDROID_CHANNEL_ID, {
    name: 'コレクション目標',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 120, 80, 120],
  });
}

/** コレクション目標達成のローカル通知（即時） */
export async function notifyGoalReached(
  completedGoal: number,
  nextGoal: number,
  t: TranslationTree,
): Promise<void> {
  const Notifications = await ensureNotificationsReady({ requestPermission: true });
  if (!Notifications) return;

  await ensureGoalAndroidChannel(Notifications);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifications.goalTitle,
      body: formatMessage(t.notifications.goalBody, {
        goal: String(completedGoal),
        next: String(nextGoal),
      }),
      sound: true,
      data: { url: '/collection' },
      ...(Platform.OS === 'android' ? { channelId: GOAL_ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
