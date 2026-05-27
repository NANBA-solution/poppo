import type { PigeonScanJson } from '@/services/aiService';
import { Image, StyleSheet, Text, View } from 'react-native';

import { ScanResultCard } from '@/components/ScanResultCard';

type ShareCaptureFrameProps = {
  imageUri: string;
  phase: 'loading' | 'success' | 'error';
  result?: PigeonScanJson | null;
  error?: string | null;
  subtitle?: string;
  watermark?: string;
};

/** view-shot でキャプチャするシェア用フレーム（ブランド帯付き） */
export function ShareCaptureFrame({
  imageUri,
  phase,
  result,
  error,
  subtitle,
  watermark = 'ぽっぽスキャン完了',
}: ShareCaptureFrameProps) {
  return (
    <View style={styles.root} collapsable={false}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="スキャンしたハトの写真"
      />
      <View style={styles.dimOverlay} pointerEvents="none" />

      <View style={styles.watermarkWrap} pointerEvents="none">
        <Text style={styles.watermark}>{watermark}</Text>
      </View>

      <View style={styles.cardOverlay} pointerEvents="none">
        <ScanResultCard
          phase={phase}
          breed={result?.breed}
          nickname={result?.nickname}
          error={error}
          subtitle={subtitle}
        />
      </View>

      <View style={styles.brandBar} pointerEvents="none">
        <Text style={styles.brandEmoji}>🕊️</Text>
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>POPPO</Text>
          <Text style={styles.brandSub}>街のハト、全部コレる。</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
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
  watermarkWrap: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  watermark: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.2)',
  },
  cardOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 72,
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
    borderTopColor: 'rgba(124,184,255,0.25)',
  },
  brandEmoji: {
    fontSize: 22,
  },
  brandTextWrap: {
    gap: 1,
  },
  brandTitle: {
    color: '#7CB8FF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandSub: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
});
