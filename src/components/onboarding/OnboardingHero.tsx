import {
  onboardingIllustrations,
  type OnboardingScene,
} from '@/constants/onboardingIllustrations';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  scene: OnboardingScene;
};

/** ステップ別イラスト（PNG） */
export function OnboardingHero({ scene }: Props) {
  return (
    <View style={styles.outer} pointerEvents="none">
      <View style={styles.frame}>
        <Image
          source={onboardingIllustrations[scene]}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityRole="image"
        />
      </View>
    </View>
  );
}

const WIDTH = 320;
const HEIGHT = 220;

const styles = StyleSheet.create({
  outer: {
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: radii.xl,
    borderWidth: borders.thin,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    overflow: 'hidden',
    ...shadow.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
