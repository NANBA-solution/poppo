import { useI18n } from '@/i18n/I18nProvider';
import {
  refreshDailyNotifications,
  registerNotificationResponse,
} from '@/services/dailyNotificationService';
import { getNotificationsEnabled } from '@/services/notificationPrefsService';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** 通知オン時のみ毎日のローカル通知を登録し、タップで画面へ誘導 */
export function DailyNotificationBootstrap() {
  const { locale } = useI18n();
  const router = useRouter();

  const syncIfEnabled = React.useCallback(async () => {
    if (!(await getNotificationsEnabled())) return;
    await refreshDailyNotifications(locale);
  }, [locale]);

  React.useEffect(() => {
    void syncIfEnabled();
  }, [syncIfEnabled]);

  React.useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') void syncIfEnabled();
    };
    const sub = AppState.addEventListener('change', onStateChange);
    return () => sub.remove();
  }, [syncIfEnabled]);

  React.useEffect(() => {
    return registerNotificationResponse((url) => {
      if (url === '/camera') router.push('/camera');
      if (url === '/quests') router.push('/quests');
    });
  }, [router]);

  React.useEffect(() => {
    void (async () => {
      const Notifications = await import('expo-notifications').catch(() => null);
      if (!Notifications) return;
      const response = await Notifications.getLastNotificationResponseAsync();
      const url = response?.notification.request.content.data?.url;
      if (url === '/camera') router.push('/camera');
      if (url === '/quests') router.push('/quests');
    })();
  }, [router]);

  return null;
}
