import { PoppoPigeonMark } from '@/components/ui/PoppoPigeonMark';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ScanDetectOverlayProps = {
  phase: 'loading' | 'success' | 'error';
  label?: string;
  errorTitle?: string;
  errorBody?: string;
};

function CornerBracket({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

/** 鳩判定中・結果のフルスクリーン演出 */
export function ScanDetectOverlay({
  phase,
  label,
  errorTitle,
  errorBody,
}: ScanDetectOverlayProps) {
  const pulse = React.useRef(new Animated.Value(0)).current;
  const sweep = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (phase !== 'loading') {
      pulse.setValue(0);
      sweep.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    );

    pulseLoop.start();
    sweepLoop.start();
    return () => {
      pulseLoop.stop();
      sweepLoop.stop();
    };
  }, [phase, pulse, sweep]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0.25],
  });
  const sweepTop = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 320],
  });

  if (phase === 'loading') {
    return (
      <View style={styles.root} pointerEvents="none">
        <View style={styles.loadingScrim} />
        <View style={styles.viewfinder}>
          <CornerBracket style={styles.cornerTL} />
          <CornerBracket style={styles.cornerTR} />
          <CornerBracket style={styles.cornerBL} />
          <CornerBracket style={styles.cornerBR} />
          <Animated.View style={[styles.sweepLine, { top: sweepTop }]} />
        </View>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <View style={styles.hud}>
          <PoppoPigeonMark size={80} />
          <ActivityIndicator size="large" color={colors.ink} style={styles.spinner} />
          <Text style={styles.hudEyebrow}>POPPO DETECT</Text>
          <Text style={styles.hudLabel}>{label}</Text>
        </View>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.root} pointerEvents="none">
        <View style={styles.successScrim} />
        <View style={styles.viewfinder}>
          <CornerBracket style={[styles.cornerTL, styles.cornerSuccess]} />
          <CornerBracket style={[styles.cornerTR, styles.cornerSuccess]} />
          <CornerBracket style={[styles.cornerBL, styles.cornerSuccess]} />
          <CornerBracket style={[styles.cornerBR, styles.cornerSuccess]} />
        </View>
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>PIGEON</Text>
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.root} pointerEvents="none">
        <View style={styles.errorScrim} />
        <View style={styles.errorPanel}>
          <Text style={styles.errorPanelTitle}>{errorTitle}</Text>
          {errorBody ? <Text style={styles.errorPanelBody}>{errorBody}</Text> : null}
        </View>
      </View>
    );
  }

  return null;
}

const CORNER = 28;
const CORNER_W = 4;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.52)',
  },
  successScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45,106,79,0.22)',
  },
  errorScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180,35,24,0.28)',
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    margin: 28,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.onAccent,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: 8,
  },
  cornerSuccess: {
    borderColor: '#7DFFB2',
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.onAccent,
  },
  hud: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.medium,
    borderColor: colors.ink,
    maxWidth: 300,
    ...shadow.floating,
  },
  spinner: {
    marginTop: 4,
  },
  hudEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  hudLabel: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 24,
  },
  successBadge: {
    position: 'absolute',
    top: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    borderWidth: borders.medium,
    borderColor: '#7DFFB2',
    ...shadow.floating,
  },
  successBadgeText: {
    color: colors.onAccent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  errorPanel: {
    marginHorizontal: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.medium,
    borderColor: colors.danger,
    gap: 10,
    maxWidth: 340,
    ...shadow.floating,
  },
  errorPanelTitle: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  errorPanelBody: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
