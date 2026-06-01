import {
  onboardingIllustrations,
  type OnboardingScene,
} from '@/constants/onboardingIllustrations';
import { colors } from '@/theme/tokens';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  scene: OnboardingScene;
  accentColor?: string;
};

/** オンボーディング各ステップのイラスト */
export function OnboardingHero({ scene, accentColor = colors.accent }: Props) {
  return (
    <View
      style={[styles.frame, { borderColor: `${accentColor}33`, shadowColor: accentColor }]}
      pointerEvents="none"
    >
      <View style={[styles.glow, { backgroundColor: `${accentColor}12` }]} />
      <Image
        source={onboardingIllustrations[scene]}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityRole="image"
      />
    </View>
  );
}

const SIZE = 280;

const styles = StyleSheet.create({
  frame: {
    width: SIZE,
    height: SIZE,
    borderRadius: 32,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: SIZE - 8,
    height: SIZE - 8,
  },
});
