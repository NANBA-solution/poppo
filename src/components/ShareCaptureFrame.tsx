import { ScanResultCard } from '@/components/ScanResultCard';
import { AppIcon } from '@/components/icons/AppIcon';
import { useI18n } from '@/i18n/I18nProvider';
import type { PigeonScanJson } from '@/services/aiService';
import { colors } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

type ShareCaptureFrameProps = {
  imageUri: string;
  phase: 'loading' | 'success' | 'error';
  result?: PigeonScanJson | null;
  error?: string | null;
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
          colors={['transparent', 'rgba(9,9,11,0.55)', colors.bg]}
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
          nickname={result?.nickname}
          error={error}
          subtitle={subtitle}
          showEyebrow={!minimal}
        />
      </View>

      {!minimal && (
        <View style={styles.brandBar} pointerEvents="none">
          <AppIcon name="pigeon" size={24} color={colors.accent} />
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
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
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
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(8,10,16,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  brandTextWrap: {
    gap: 1,
  },
  brandTitle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
