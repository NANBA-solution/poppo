import { colors } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type GradientBackgroundProps = {
  style?: ViewStyle;
};

/** ネイティブ LinearGradient に依存せず、単色レイヤーでグラデーションを再現 */
export function GradientBackground({ style }: GradientBackgroundProps) {
  return (
    <View style={[styles.fallback, style]}>
      <View style={styles.fallbackTop} />
      <View style={styles.fallbackBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  fallbackTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: '120%',
    height: '55%',
    backgroundColor: '#1a1430',
    opacity: 0.7,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
  },
  fallbackBottom: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -40,
    height: '50%',
    backgroundColor: '#120a1e',
    opacity: 0.65,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
});
