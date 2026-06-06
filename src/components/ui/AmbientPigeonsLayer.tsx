import { PoppoPigeonMark } from '@/components/ui/PoppoPigeonMark';
import * as React from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const MARK_SIZE = 52;
const BOTTOM = 22;
const MARGIN = 16;
const WALK_MS = 28000;
const STEP_MS = 340;

function WaddlingPigeon({ laneWidth }: { laneWidth: number }) {
  const travel = React.useRef(new Animated.Value(0)).current;
  const step = React.useRef(new Animated.Value(0)).current;
  const facing = React.useRef(new Animated.Value(1)).current;

  const minX = MARGIN;
  const maxX = Math.max(minX + 1, laneWidth - MARK_SIZE - MARGIN);

  React.useEffect(() => {
    const walkRight = Animated.timing(travel, {
      toValue: 1,
      duration: WALK_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const walkLeft = Animated.timing(travel, {
      toValue: 0,
      duration: WALK_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const faceRight = Animated.timing(facing, {
      toValue: 1,
      duration: 1,
      useNativeDriver: true,
    });
    const faceLeft = Animated.timing(facing, {
      toValue: -1,
      duration: 1,
      useNativeDriver: true,
    });

    const walkLoop = Animated.loop(
      Animated.sequence([
        faceRight,
        walkRight,
        faceLeft,
        walkLeft,
      ]),
    );

    const stepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(step, {
          toValue: 1,
          duration: STEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(step, {
          toValue: 0,
          duration: STEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    walkLoop.start();
    stepLoop.start();
    return () => {
      walkLoop.stop();
      stepLoop.stop();
    };
  }, [facing, step, travel]);

  const translateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [minX, maxX],
  });
  const bobY = step.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, 0],
  });
  const tilt = step.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '5deg', '-5deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pigeon,
        {
          opacity: 0.34,
          transform: [
            { translateX },
            { translateY: bobY },
            { rotate: tilt },
            { scaleX: facing },
          ],
        },
      ]}
    >
      <PoppoPigeonMark size={MARK_SIZE} />
    </Animated.View>
  );
}

/** よちよち歩きのブランド鳩 */
export function AmbientPigeonsLayer() {
  const { width } = useWindowDimensions();

  return (
    <View
      style={styles.layer}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <WaddlingPigeon laneWidth={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    elevation: 2,
  },
  pigeon: {
    position: 'absolute',
    left: 0,
    bottom: BOTTOM,
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
});
