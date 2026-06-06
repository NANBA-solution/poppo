import { requireOptionalNativeModule } from 'expo-modules-core';

const QUEST_PIRORIN = require('../../assets/sounds/quest-pirorin.mp3');

let nativeAvUsable = requireOptionalNativeModule('ExponentAV') != null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let questSound: any = null;
let loading: Promise<void> | null = null;

async function ensureQuestSound() {
  if (!nativeAvUsable) return null;
  if (questSound) return questSound;
  if (loading) {
    await loading;
    return questSound;
  }

  loading = (async () => {
    try {
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(QUEST_PIRORIN, { volume: 1 });
      questSound = sound;
    } catch {
      nativeAvUsable = false;
      questSound = null;
    }
  })();

  await loading;
  loading = null;
  return questSound;
}

export function preloadQuestComplete(): void {
  void ensureQuestSound();
}

/** クエスト達成時のピロリン SE */
export async function playQuestComplete(): Promise<void> {
  if (!nativeAvUsable) return;
  try {
    const sound = await ensureQuestSound();
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    nativeAvUsable = false;
  }
}
