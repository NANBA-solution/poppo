import { requireOptionalNativeModule } from 'expo-modules-core';

const PIGEON_COO = require('../../assets/sounds/pigeon-coo.mp3');

let nativeAvUsable = requireOptionalNativeModule('ExponentAV') != null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cooSound: any = null;
let loading: Promise<void> | null = null;

async function ensureCooSound() {
  if (!nativeAvUsable) return null;
  if (cooSound) return cooSound;
  if (loading) {
    await loading;
    return cooSound;
  }

  loading = (async () => {
    try {
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(PIGEON_COO, { volume: 0.95 });
      cooSound = sound;
    } catch {
      nativeAvUsable = false;
      cooSound = null;
    }
  })();

  await loading;
  loading = null;
  return cooSound;
}

export function isPigeonCooSoundAvailable(): boolean {
  return nativeAvUsable;
}

/** @deprecated use isPigeonCooSoundAvailable */
export function isPigeonShutterSoundAvailable(): boolean {
  return isPigeonCooSoundAvailable();
}

/** 先読み（シャッター・通知の初回遅延を抑える） */
export function preloadPigeonCoo(): void {
  void ensureCooSound();
}

/** @deprecated use preloadPigeonCoo */
export function preloadPigeonShutter(): void {
  preloadPigeonCoo();
}

async function playCoo(): Promise<void> {
  if (!nativeAvUsable) return;
  try {
    const sound = await ensureCooSound();
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    nativeAvUsable = false;
  }
}

/** シャッター時のハトの鳴き声 */
export async function playPigeonShutter(): Promise<void> {
  await playCoo();
}

/** 通知フィードバック用（スキャン成功・警告など） */
export async function playPigeonNotification(): Promise<void> {
  await playCoo();
}

/** タブ・ナビ pill 押下時 */
export async function playPigeonTab(): Promise<void> {
  await playCoo();
}
