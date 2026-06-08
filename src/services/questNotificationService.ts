import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import { ensureNotificationsReady } from '@/services/dailyNotificationService';
import type { AppLocale } from '@/services/localeService';
import { Platform } from 'react-native';

const QUEST_ANDROID_CHANNEL_ID = 'poppo-quest';

async function ensureQuestAndroidChannel(
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(QUEST_ANDROID_CHANNEL_ID, {
    name: 'クエスト達成',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 100, 80, 100],
  });
}

/** 新規達成したクエストのローカル通知（即時） */
export async function notifyQuestsCompleted(
  titles: string[],
  t: TranslationTree,
  locale: AppLocale,
): Promise<void> {
  if (titles.length === 0) return;

  const Notifications = await ensureNotificationsReady({ requestPermission: true });
  if (!Notifications) return;

  await ensureQuestAndroidChannel(Notifications);

  const body =
    titles.length === 1
      ? formatMessage(t.notifications.questBody, { title: titles[0] })
      : formatMessage(t.notifications.questBodyMultiple, {
          count: String(titles.length),
          titles: titles.join(locale === 'ja' ? '、' : ', '),
        });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.notifications.questTitle,
      body,
      sound: true,
      data: { url: '/quests' },
      ...(Platform.OS === 'android' ? { channelId: QUEST_ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
