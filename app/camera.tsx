import { colors } from '@/theme/tokens';
import { isExpoCameraNativeAvailable } from '@/utils/nativeAvailability';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type CameraModule = { default: React.ComponentType };

export default function CameraRoute() {
  const [Screen, setScreen] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    if (!isExpoCameraNativeAvailable()) {
      setError(
        'この開発ビルドにカメラ（expo-camera）が含まれていません。npm run build:dev:ios で作り直してください。',
      );
      return () => {
        active = false;
      };
    }

    void import('@/screens/CameraScreen')
      .then((mod: CameraModule) => {
        if (active) setScreen(() => mod.default);
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Camera module failed to load');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>カメラを起動できません</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.errorHint}>
          開発ビルドを作り直してください: npm run build:dev:ios
        </Text>
      </View>
    );
  }

  if (!Screen) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>カメラ起動中…</Text>
      </View>
    );
  }

  return <Screen />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cameraBg,
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBody: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorHint: {
    color: colors.accent,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
});
