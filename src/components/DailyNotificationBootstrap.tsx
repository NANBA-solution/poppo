import { useI18n } from '@/i18n/I18nProvider';
import {
  refreshDailyNotifications,
  registerNotificationResponse,
} from '@/services/dailyNotificationService';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** 毎日1回のローカル通知を登録し、タップでカメラへ誘導 */
export function DailyNotificationBootstrap() {
  const { locale } = useI18n();
  const router = useRouter();

  React.useEffect(() => {
    void refreshDailyNotifications(locale);
  }, [locale]);

  React.useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refreshDailyNotifications(locale);
      }
    };
    const sub = AppState.addEventListener('change', onStateChange);
    return () => sub.remove();
  }, [locale]);

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
