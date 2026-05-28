import { getPigeonCount } from '@/services/collectionService';
import { hapticLight } from '@/utils/haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { FlashMode } from 'expo-camera';
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
const FLASH_LABEL: Record<FlashMode, string> = {
  off: '⚡ OFF',
  on: '⚡ ON',
  auto: '⚡ AUTO',
};

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = React.useRef<InstanceType<typeof CameraView>>(null);
  // 一部環境で onCameraReady が発火せず、オーバーレイが残り続けるため初期値を true にする
  const [ready, setReady] = React.useState(true);
  const [capturing, setCapturing] = React.useState(false);
  const [zoom, setZoom] = React.useState(0);
  const zoomRef = React.useRef(0);
  const zoomBase = React.useRef(0);
  const [focusPoint, setFocusPoint] = React.useState<FocusPoint | null>(null);
  const focusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collectionCount, setCollectionCount] = React.useState(0);
  const [flash, setFlash] = React.useState<FlashMode>('off');

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getPigeonCount().then((count) => {
        if (active) setCollectionCount(count);
      });
      return () => {
        active = false;
      };
    }, []),
  );

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

  const onShutter = React.useCallback(async () => {
    if (!ready || capturing) return;
    const cam = cameraRef.current;
    if (!cam) return;

    try {
      setCapturing(true);
      void hapticLight();
      const shot = await cam.takePictureAsync({ quality: 0.92, skipProcessing: false });
      router.push({
        pathname: '/result',
        params: { uri: encodeURIComponent(shot.uri) },
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '撮影に失敗しました。もう一度お試しください。';
      Alert.alert('撮影エラー', msg);
    } finally {
      setCapturing(false);
    }
  }, [capturing, ready, router]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <Text style={styles.permissionTitle}>カメラの許可が必要です</Text>
        <Text style={styles.permissionBody}>
          撮影にはカメラへのアクセスを許可してください。
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnLabel}>許可する</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GestureDetector gesture={cameraGestures}>
        <View style={styles.cameraWrap}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="picture"
            zoom={zoom}
            flash={flash}
            autofocus="off"
            onCameraReady={() => setReady(true)}
            onMountError={(e) => Alert.alert('カメラエラー', e.message)}
          />
          {focusPoint && (
            <View
              pointerEvents="none"
              style={[
                styles.focusRing,
                { left: focusPoint.x - 28, top: focusPoint.y - 28 },
              ]}
            />
          )}
        </View>
      </GestureDetector>

      {!ready && (
        <View style={[styles.overlay, StyleSheet.absoluteFillObject]} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>準備中…</Text>
        </View>
      )}

      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`フラッシュ ${flash}`}
          onPress={cycleFlash}
          style={({ pressed }) => [styles.flashBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.flashBtnLabel}>{FLASH_LABEL[flash]}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="マイぽっぽを開く"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.profileBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.profileBtnLabel}>🕊️ マイぽっぽ</Text>
          {collectionCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>
                {collectionCount > 99 ? '99+' : collectionCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View
        style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        pointerEvents="box-none"
      >
        <Text style={styles.hint}>ピンチでズーム · タップでフォーカス</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="シャッター"
          disabled={!ready || capturing}
          onPress={onShutter}
          style={[
            styles.shutterOuter,
            (!ready || capturing) && styles.shutterDisabled,
          ]}
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
    backgroundColor: '#000',
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  focusRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(124,184,255,0.95)',
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnLabel: {
    fontWeight: '700',
    color: '#111',
  },
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 10,
  },
  overlayText: {
    color: '#fff',
    fontWeight: '600',
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
  flashBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  flashBtnLabel: {
    color: '#F4F7FA',
    fontSize: 13,
    fontWeight: '700',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileBtnLabel: {
    color: '#F4F7FA',
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#7CB8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    color: '#0a2540',
    fontSize: 12,
    fontWeight: '800',
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 10,
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
    borderColor: '#fff',
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
    backgroundColor: '#fff',
  },
  btnPressed: {
    opacity: 0.88,
  },
});
