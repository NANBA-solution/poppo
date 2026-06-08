import { GradientBackground } from '@/components/ui/GradientBackground';
import { borders, colors, radii, shadow, typography } from '@/theme/tokens';
import * as React from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LaunchScreenProps = {
  /** 下部に表示するステータス（省略時はドットローダーのみ） */
  status?: string;
};

function DotLoader() {
  const dot0 = React.useRef(new Animated.Value(0.35)).current;
  const dot1 = React.useRef(new Animated.Value(0.35)).current;
  const dot2 = React.useRef(new Animated.Value(0.35)).current;
  const dots = [dot0, dot1, dot2];

  React.useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 420,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 140),
        ]),
      ),
    );

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, [dot0, dot1, dot2]);

  return (
    <View style={styles.dots} accessibilityLabel="読み込み中">
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0.35, 1],
                    outputRange: [0.85, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/** アプリ起動・ルーティング待ちのブランドスプラッシュ */
export function LaunchScreen({ status }: LaunchScreenProps) {
  const fade = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(18)).current;
  const iconScale = React.useRef(new Animated.Value(0.88)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, iconScale, rise]);

  return (
    <View style={styles.root}>
      <GradientBackground />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [{ translateY: rise }],
          },
        ]}
      >
        <Animated.View style={[styles.iconFrame, { transform: [{ scale: iconScale }] }]}>
          <Image
            source={require('../../../assets/brand-icon.png')}
            style={styles.icon}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>

        <Text style={styles.eyebrow}>STREET PIGEON SCANNER</Text>
        <Text style={styles.wordmark}>POPPO</Text>
        <Text style={styles.subtitle}>ぽっぽ</Text>

        <View style={styles.loaderBlock}>
          <DotLoader />
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconFrame: {
    width: 96,
    height: 96,
    borderRadius: radii.xl,
    borderWidth: borders.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...shadow.floating,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 10,
  },
  wordmark: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2.4,
    lineHeight: 46,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 6,
  },
  loaderBlock: {
    marginTop: 40,
    alignItems: 'center',
    gap: 14,
    minHeight: 44,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.text,
  },
  status: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
