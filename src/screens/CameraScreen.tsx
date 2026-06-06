import { FloatingPill } from '@/components/ui/FloatingPill';
import { useI18n } from '@/i18n/I18nProvider';
import { getPigeonCount } from '@/services/collectionService';
import { colors } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import { playPigeonShutter } from '@/utils/pigeonSound';
import type { IconName } from '@/components/icons/AppIcon';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FocusPoint = { x: number; y: number };

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];
const CAMERA_READY_TIMEOUT_MS = 8000;
const TAKE_PICTURE_TIMEOUT_MS = 12000;
const TAKE_PICTURE_RETRIES = 3;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = React.useRef<InstanceType<typeof CameraView>>(null);
  const cameraReadyRef = React.useRef(false);
  const readyWaitersRef = React.useRef<Array<() => void>>([]);
  const [ready, setReady] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);
  const [zoom, setZoom] = React.useState(0);
  const zoomRef = React.useRef(0);
  const zoomBase = React.useRef(0);
  const [focusPoint, setFocusPoint] = React.useState<FocusPoint | null>(null);
  const focusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collectionCount, setCollectionCount] = React.useState(0);
  const [flash, setFlash] = React.useState<FlashMode>('off');
  const [permissionSlow, setPermissionSlow] = React.useState(false);

  React.useEffect(() => {
    if (permission != null) {
      setPermissionSlow(false);
      return;
    }
    const timer = setTimeout(() => setPermissionSlow(true), 2500);
    return () => clearTimeout(timer);
  }, [permission]);

  React.useEffect(() => {
    if (permission != null) return;
    void requestPermission();
  }, [permission, requestPermission]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      void getPigeonCount().then((count) => {
        if (active) setCollectionCount(count);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const flashIcon: IconName = flash === 'auto' ? 'flash-auto' : 'flash';

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    return () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    };
  }, []);

  const showFocusRing = React.useCallback((x: number, y: number) => {
    if (focusTimer.current) clearTimeout(focusTimer.current);
    setFocusPoint({ x, y });
    focusTimer.current = setTimeout(() => setFocusPoint(null), 900);
  }, []);

  const pinchGesture = React.useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          zoomBase.current = zoomRef.current;
        })
        .onUpdate((e) => {
          const next = Math.min(1, Math.max(0, zoomBase.current + (e.scale - 1) * 0.35));
          setZoom(next);
        })
        .onEnd(() => {
          zoomBase.current = zoomRef.current;
        }),
    [],
  );

  const tapGesture = React.useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        showFocusRing(e.x, e.y);
      }),
    [showFocusRing],
  );

  const cameraGestures = React.useMemo(
    () => Gesture.Simultaneous(pinchGesture, tapGesture),
    [pinchGesture, tapGesture],
  );

  const cycleFlash = React.useCallback(() => {
    void hapticLight();
    setFlash((current) => {
      const idx = FLASH_CYCLE.indexOf(current);
      return FLASH_CYCLE[(idx + 1) % FLASH_CYCLE.length];
    });
  }, []);

  const markCameraReady = React.useCallback(() => {
    if (cameraReadyRef.current) return;
    cameraReadyRef.current = true;
    setReady(true);
    for (const resolve of readyWaitersRef.current) resolve();
    readyWaitersRef.current = [];
  }, []);

  const waitForCameraReady = React.useCallback(async () => {
    if (cameraReadyRef.current) return;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        readyWaitersRef.current = readyWaitersRef.current.filter((fn) => fn !== onReady);
        reject(new Error(t.camera.notReady));
      }, CAMERA_READY_TIMEOUT_MS);
      const onReady = () => {
        clearTimeout(timer);
        resolve();
      };
      readyWaitersRef.current.push(onReady);
    });
  }, [t.camera.notReady]);

  React.useEffect(() => {
    cameraReadyRef.current = false;
    setReady(false);
    const fallback = setTimeout(() => markCameraReady(), 1200);
    return () => clearTimeout(fallback);
  }, [markCameraReady]);

  const navigateToResult = React.useCallback(
    (uri: string) => {
      router.push({
        pathname: '/result',
        params: { uri: encodeURIComponent(uri) },
      });
    },
    [router],
  );

  const captureWithSystemCamera = React.useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.camera.permissionTitle, t.camera.permissionBody);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    void hapticLight();
    navigateToResult(result.assets[0].uri);
  }, [
    navigateToResult,
    t.camera.permissionBody,
    t.camera.permissionTitle,
  ]);

  const takePictureWithTimeout = React.useCallback(
    async (cam: NonNullable<typeof cameraRef.current>) => {
      return Promise.race([
        cam.takePictureAsync({ quality: 0.92, skipProcessing: false }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(t.camera.captureFailed)), TAKE_PICTURE_TIMEOUT_MS);
        }),
      ]);
    },
    [t.camera.captureFailed],
  );

  const onShutter = React.useCallback(async () => {
    if (capturing) return;

    try {
      setCapturing(true);
      void hapticLight();
      void playPigeonShutter();

      const cam = cameraRef.current;
      if (cam) {
        try {
          await waitForCameraReady();
          for (let attempt = 0; attempt < TAKE_PICTURE_RETRIES; attempt += 1) {
            try {
              const shot = await takePictureWithTimeout(cam);
              if (shot?.uri) {
                navigateToResult(shot.uri);
                return;
              }
            } catch {
              if (attempt < TAKE_PICTURE_RETRIES - 1) {
                await delay(400);
              }
            }
          }
        } catch {
          // アプリ内カメラが未準備のときは標準カメラへ
        }
      }

      await captureWithSystemCamera();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.camera.captureFailed;
      Alert.alert(t.camera.captureError, msg);
    } finally {
      setCapturing(false);
    }
  }, [
    captureWithSystemCamera,
    capturing,
    navigateToResult,
    takePictureWithTimeout,
    waitForCameraReady,
    t.camera.captureError,
    t.camera.captureFailed,
  ]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.permissionLoadingText}>{t.camera.preparing}</Text>
        {permissionSlow ? (
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnLabel}>{t.camera.allow}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <Text style={styles.permissionTitle}>{t.camera.permissionTitle}</Text>
        <Text style={styles.permissionBody}>{t.camera.permissionBody}</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnLabel}>{t.camera.allow}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          mode="picture"
          zoom={zoom}
          flash={flash}
          onCameraReady={markCameraReady}
          onMountError={(e) => Alert.alert(t.camera.mountError, e.message)}
        />
        <GestureDetector gesture={cameraGestures}>
          <View style={styles.gestureLayer} />
        </GestureDetector>
        {focusPoint ? (
          <View
            pointerEvents="none"
            style={[
              styles.focusRing,
              { left: focusPoint.x - 28, top: focusPoint.y - 28 },
            ]}
          />
        ) : null}
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <FloatingPill
          icon={flashIcon}
          variant="paper"
          label={
            flash === 'off'
              ? t.camera.flashOff
              : flash === 'on'
                ? t.camera.flashOn
                : t.camera.flashAuto
          }
          onPress={cycleFlash}
        />
        <View style={styles.topRight}>
          <FloatingPill
            imageIcon={require('../../assets/brand-icon.png')}
            variant="paper"
            label={t.camera.myPoppo}
            onPress={() => router.push('/profile')}
            badge={collectionCount > 0 ? (collectionCount > 99 ? '99+' : collectionCount) : undefined}
          />
        </View>
      </View>

      <View
        style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        pointerEvents="box-none"
      >
        <Text style={styles.hint}>{t.camera.hint}</Text>
        <View style={styles.toolbarRow}>
          <FloatingPill
            icon="book"
            variant="paper"
            label={t.profile.dex}
            onPress={() => router.push('/dex')}
          />
          <FloatingPill
            icon="target"
            variant="paper"
            label={t.profile.quests}
            onPress={() => router.push('/quests')}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.camera.shutter}
          disabled={capturing}
          onPress={onShutter}
          style={[styles.shutterOuter, capturing && styles.shutterDisabled]}
        >
          {capturing ? (
            <ActivityIndicator color="#222" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cameraBg,
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  focusRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.onAccent,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cameraBg,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionBody: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  permissionLoadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnLabel: {
    fontWeight: '700',
    color: colors.onAccent,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topRight: {
    alignItems: 'flex-end',
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(26,26,26,0.55)',
    gap: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.onAccent,
  },
});
