import { ScanDetectOverlay } from '@/components/ScanDetectOverlay';
import { ScanResultCard } from '@/components/ScanResultCard';
import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type ShareCaptureFrameProps = {
  imageUri: string;
  phase: 'loading' | 'success' | 'error';
  headline?: string;
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
  headline,
  error,
  errorTitle,
  subtitle,
  minimal = false,
}: ShareCaptureFrameProps) {
  const { t } = useI18n();
  const [fxVisible, setFxVisible] = React.useState(phase === 'loading');

  React.useEffect(() => {
    if (phase === 'loading') {
      setFxVisible(true);
      return;
    }
    if (phase === 'success') {
      setFxVisible(true);
      const timer = setTimeout(() => setFxVisible(false), 1400);
      return () => clearTimeout(timer);
    }
    if (phase === 'error') {
      setFxVisible(true);
      return;
    }
    setFxVisible(false);
  }, [phase]);

  return (
    <View style={styles.root} collapsable={false}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="スキャンしたハトの写真"
      />
      <View
        style={[
          styles.dimOverlay,
          phase === 'loading' && styles.dimOverlayScanning,
          phase === 'success' && fxVisible && styles.dimOverlaySuccess,
          phase === 'error' && styles.dimOverlayError,
        ]}
        pointerEvents="none"
      />

      {fxVisible ? (
        <ScanDetectOverlay
          phase={phase}
          label={t.scan.recognizing}
          errorTitle={errorTitle ?? t.scan.errorTitle}
          errorBody={error ?? undefined}
        />
      ) : null}

      {minimal && phase !== 'loading' && (
        <LinearGradient
          colors={['transparent', 'rgba(26,26,26,0.35)', colors.paper]}
          locations={[0, 0.45, 1]}
          style={styles.bottomScrim}
          pointerEvents="none"
        />
      )}

      {phase === 'success' && (
        <View
          style={[styles.cardOverlay, minimal && styles.cardOverlayMinimal]}
          pointerEvents="none"
        >
          <ScanResultCard
            phase={phase}
            headline={headline}
            error={error}
            errorTitle={errorTitle}
            subtitle={subtitle}
            showEyebrow={!minimal}
          />
        </View>
      )}

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
  dimOverlayScanning: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dimOverlaySuccess: {
    backgroundColor: 'rgba(45,106,79,0.12)',
  },
  dimOverlayError: {
    backgroundColor: 'rgba(180,35,24,0.18)',
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
