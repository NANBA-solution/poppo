import CameraScreen from '@/screens/CameraScreen';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/tokens';
import { isExpoCameraNativeAvailable } from '@/utils/nativeAvailability';
import { StyleSheet, Text, View } from 'react-native';

export default function CameraRoute() {
  const { t } = useI18n();

  if (!isExpoCameraNativeAvailable()) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t.camera.nativeMissingTitle}</Text>
        <Text style={styles.errorBody}>{t.camera.nativeMissingBody}</Text>
        <Text style={styles.errorHint}>{t.camera.nativeMissingHint}</Text>
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
    color: colors.paper,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBody: {
    color: 'rgba(245,241,234,0.78)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorHint: {
    color: 'rgba(245,241,234,0.55)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
