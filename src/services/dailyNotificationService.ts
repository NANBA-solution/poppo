import {
  pickDailyNotification,
  type DailyNotificationCopy,
} from '@/constants/dailyNotifications';
import type { AppLocale } from '@/services/localeService';
import { Platform } from 'react-native';

const NOTIFICATION_PREFIX = 'poppo-daily-';
const SCHEDULE_AHEAD_DAYS = 14;
const NOTIFY_HOUR = 10;
const NOTIFY_MINUTE = 0;
const ANDROID_CHANNEL_ID = 'poppo-daily';

let handlerReady = false;

type NotificationsModule = typeof import('expo-notifications');

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

function ensureForegroundHandler(Notifications: NotificationsModule): void {
  if (handlerReady) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerReady = true;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '毎日のぽっぽ',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 120, 80, 120],
  });
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return requested.granted;
}

function buildFireDate(dayOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(NOTIFY_HOUR, NOTIFY_MINUTE, 0, 0);
  return date;
}

async function cancelScheduledDaily(Notifications: NotificationsModule): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(NOTIFICATION_PREFIX))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function refreshDailyNotifications(locale: AppLocale): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  ensureForegroundHandler(Notifications);
  await ensureAndroidChannel(Notifications);

  const granted = await ensurePermission(Notifications);
  if (!granted) return;

  await cancelScheduledDaily(Notifications);

  const now = Date.now();
  for (let offset = 0; offset <= SCHEDULE_AHEAD_DAYS; offset += 1) {
    const fireAt = buildFireDate(offset);
    if (fireAt.getTime() <= now) continue;

    const copy: DailyNotificationCopy = pickDailyNotification(fireAt, locale);
    const dayKey = fireAt.toISOString().slice(0, 10);

    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_PREFIX}${dayKey}`,
      content: {
        title: copy.title,
        body: copy.body,
        sound: true,
        data: { url: '/camera' },
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }
}

export function registerDailyNotificationResponse(
  onOpenCamera: () => void,
): () => void {
  let remove: (() => void) | undefined;
  let cancelled = false;

  void (async () => {
    const Notifications = await loadNotifications();
    if (!Notifications || cancelled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (url === '/camera') onOpenCamera();
    });

    remove = () => subscription.remove();
  })();

  return () => {
    cancelled = true;
    remove?.();
  };
}
