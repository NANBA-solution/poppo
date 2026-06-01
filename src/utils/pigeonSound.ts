import { requireOptionalNativeModule } from 'expo-modules-core';

let nativeAvUsable = requireOptionalNativeModule('ExponentAV') != null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let shutterSound: any = null;
let loading: Promise<void> | null = null;

async function ensureShutterSound() {
  if (!nativeAvUsable) return null;
  if (shutterSound) return shutterSound;
  if (loading) {
    await loading;
    return shutterSound;
  }

  loading = (async () => {
    try {
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/pigeon-shutter.wav'),
        { volume: 0.9 },
      );
      shutterSound = sound;
    } catch {
      nativeAvUsable = false;
      shutterSound = null;
    }
  })();

  await loading;
  loading = null;
  return shutterSound;
}

export function isPigeonShutterSoundAvailable(): boolean {
  return nativeAvUsable;
}

/** シャッター時のハトの鳴き声（失敗時は以降スキップ） */
export async function playPigeonShutter(): Promise<void> {
  if (!nativeAvUsable) return;
  try {
    const sound = await ensureShutterSound();
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    nativeAvUsable = false;
  }
}
