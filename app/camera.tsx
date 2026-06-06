import CameraScreen from '@/screens/CameraScreen';
import { colors } from '@/theme/tokens';
import { isExpoCameraNativeAvailable } from '@/utils/nativeAvailability';
import { StyleSheet, Text, View } from 'react-native';

export default function CameraRoute() {
  if (!isExpoCameraNativeAvailable()) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>カメラを起動できません</Text>
        <Text style={styles.errorBody}>
          この開発ビルドにカメラ（expo-camera）が含まれていません。npm run build:dev:ios
          で作り直してください。
        </Text>
        <Text style={styles.errorHint}>
          開発ビルドを作り直してください: npm run build:dev:ios
        </Text>
      </View>
    );
  }

  return <CameraScreen />;
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
