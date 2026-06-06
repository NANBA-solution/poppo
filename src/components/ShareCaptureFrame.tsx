import { ScanResultCard } from '@/components/ScanResultCard';
import { useI18n } from '@/i18n/I18nProvider';
import type { PigeonScanJson } from '@/types/scan';
import { borders, colors } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

type ShareCaptureFrameProps = {
  imageUri: string;
  phase: 'loading' | 'success' | 'error';
  result?: PigeonScanJson | null;
  error?: string | null;
  errorTitle?: string;
  subtitle?: string;
  /** 透かし・ブランド帯なしのシンプル表示 */
  minimal?: boolean;
};

/** view-shot でキャプチャするシェア用フレーム（ブランド帯付き） */
export function ShareCaptureFrame({
  imageUri,
  phase,
  result,
  error,
  errorTitle,
  subtitle,
  minimal = false,
}: ShareCaptureFrameProps) {
  const { t } = useI18n();

  return (
    <View style={styles.root} collapsable={false}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="スキャンしたハトの写真"
      />
      <View style={styles.dimOverlay} pointerEvents="none" />

      {minimal && (
        <LinearGradient
          colors={['transparent', 'rgba(26,26,26,0.35)', colors.paper]}
          locations={[0, 0.45, 1]}
          style={styles.bottomScrim}
          pointerEvents="none"
        />
      )}

      <View
        style={[styles.cardOverlay, minimal && styles.cardOverlayMinimal]}
        pointerEvents="none"
      >
        <ScanResultCard
          phase={phase}
          breed={result?.breed}
          error={error}
          errorTitle={errorTitle}
          subtitle={subtitle}
          showEyebrow={!minimal}
        />
      </View>

      {!minimal && (
        <View style={styles.brandBar} pointerEvents="none">
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>POPPO</Text>
            <Text style={styles.brandSub}>{t.scan.brandTagline}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
  },
  cardOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 72,
  },
  cardOverlayMinimal: {
    bottom: 24,
  },
  brandBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.ink,
    borderWidth: borders.medium,
    borderColor: colors.ink,
  },
  brandTextWrap: {
    gap: 2,
    alignItems: 'center',
  },
  brandTitle: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSub: {
    color: 'rgba(250,244,234,0.75)',
    fontSize: 11,
    fontWeight: '700',
  },
});
