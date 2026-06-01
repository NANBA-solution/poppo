import { GradientBackground } from '@/components/ui/GradientBackground';
import { colors } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  edges?: boolean;
};

export function Screen({ children, style, edges = true, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root} {...rest}>
      <GradientBackground />
      <View style={[styles.orbA, styles.orb]} />
      <View style={[styles.orbB, styles.orb]} />
      <View
        style={[
          styles.content,
          edges && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  orbA: {
    width: 220,
    height: 220,
    top: -40,
    right: -60,
    backgroundColor: 'rgba(167,139,250,0.2)',
  },
  orbB: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -70,
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
});
