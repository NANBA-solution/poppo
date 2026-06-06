import * as Haptics from 'expo-haptics';
import { playPigeonNotification } from '@/utils/pigeonSound';

export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // シミュレータなど非対応環境は無視
  }
}

export async function hapticSuccess(): Promise<void> {
  void playPigeonNotification();
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // 非対応環境は無視
  }
}

export async function hapticWarning(): Promise<void> {
  void playPigeonNotification();
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // 非対応環境は無視
  }
}
