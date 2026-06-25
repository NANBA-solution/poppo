import { useI18n } from '@/i18n/I18nProvider';
import { colors, radii } from '@/theme/tokens';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ScanFramingGuideProps = {
  onDismiss: () => void;
};

export function ScanFramingGuide({ onDismiss }: ScanFramingGuideProps) {
  const { t } = useI18n();

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.callout} pointerEvents="none">
        <Text style={styles.title}>{t.scan.framingGuideTitle}</Text>
        <View style={styles.steps}>
          <Text style={styles.step}>{t.scan.framingGuidePinch}</Text>
          <Text style={styles.step}>{t.scan.framingGuideDrag}</Text>
        </View>
        <Text style={styles.tryHint}>{t.scan.framingGuideTry}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.scan.framingGuideDismiss}
        onPress={onDismiss}
        style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
      >
        <Text style={styles.dismissText}>{t.scan.framingGuideDismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 14,
    paddingTop: 18,
    paddingBottom: 16,
  },
  callout: {
    alignSelf: 'center',
    maxWidth: 280,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: 'rgba(17,17,17,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 8,
  },
  title: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  steps: {
    gap: 4,
  },
  step: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
  tryHint: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  dismissBtn: {
    alignSelf: 'center',
    minWidth: 112,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.onAccent,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.08)',
  },
  dismissText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
