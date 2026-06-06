import { colors } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type GradientBackgroundProps = {
  style?: ViewStyle;
};

/** アイコン準拠のクリーム背景 + ソフトグロー */
export function GradientBackground({ style }: GradientBackgroundProps) {
  return (
    <View style={[styles.root, style]} pointerEvents="none">
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.paper,
    overflow: 'hidden',
  },
  glowPrimary: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glow,
    top: '18%',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -160,
    opacity: 0.9,
  },
  glowSecondary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    bottom: '12%',
    right: -40,
    opacity: 0.55,
  },
});
