import { GradientBackground } from '@/components/ui/GradientBackground';
import { WalkingPigeonsOverlay } from '@/components/ui/WalkingPigeonsOverlay';
import { colors } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  edges?: boolean;
  /** 背景の歩行鳩エフェクト（カメラ・写真画面では off 推奨） */
  pigeons?: boolean;
};

export function Screen({ children, style, edges = true, pigeons = true, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root} {...rest}>
      <GradientBackground />
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
      {pigeons ? <WalkingPigeonsOverlay /> : null}
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
    zIndex: 1,
  },
});
