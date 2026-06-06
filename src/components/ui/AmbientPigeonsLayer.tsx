import {
  WANDER_PIGEON_FRAMES,
  WANDER_SPRITE_HEIGHT,
  WANDER_SPRITE_WIDTH,
} from '@/constants/wanderPigeonFrames';
import { PoopMark } from '@/components/ui/PoopMark';
import { hapticLight } from '@/utils/haptics';
import { playPigeonTab } from '@/utils/pigeonSound';
import * as React from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const MARK_SIZE = WANDER_SPRITE_WIDTH;
const SPRITE_HEIGHT = WANDER_SPRITE_HEIGHT;
const FRAME_COUNT = WANDER_PIGEON_FRAMES.length;
const POOP_SIZE = 14;
const BOTTOM = 22;
const MARGIN = 16;
const MAX_POOPS = 48;
const POOP_DROP_MS = 320;

type PoopSpot = { id: number; x: number };

type Pace = 'stroll' | 'amble' | 'dash';

const PACE: Record<Pace, { walkMs: number; stepMs: number; bob: number; opacity: number }> = {
  stroll: { walkMs: 28000, stepMs: 340, bob: 4, opacity: 0.92 },
  amble: { walkMs: 44000, stepMs: 520, bob: 3, opacity: 0.78 },
  dash: { walkMs: 4200, stepMs: 90, bob: 6, opacity: 1 },
};

const DASH_HOLD_MS = 2600;
const AMBLE_EVERY_MS = 32000;

function DroppedPoop({ x }: { x: number }) {
  const drop = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(drop, {
        toValue: 1,
        duration: POOP_DROP_MS,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
    ]).start();
  }, [drop, opacity]);

  const translateY = drop.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.poop,
        {
          left: x,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <PoopMark size={POOP_SIZE} />
    </Animated.View>
  );
}

function WaddlingPigeon({
  laneWidth,
  onTap,
}: {
  laneWidth: number;
  onTap: (centerX: number) => void;
}) {
  const travel = React.useRef(new Animated.Value(0)).current;
  const step = React.useRef(new Animated.Value(0)).current;
  const facing = React.useRef(new Animated.Value(1)).current;
  const paceAnim = React.useRef(new Animated.Value(0)).current;

  const paceRef = React.useRef<Pace>('stroll');
  const directionRef = React.useRef<'right' | 'left'>('right');
  const stepLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const frameTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [frameIndex, setFrameIndex] = React.useState(0);
  const walkActiveRef = React.useRef(true);
  const dashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambleTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pigeonXRef = React.useRef(MARGIN);

  const minX = MARGIN;
  const maxX = Math.max(minX + 1, laneWidth - MARK_SIZE - MARGIN);

  const stopFrameLoop = React.useCallback(() => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    frameTimerRef.current = null;
  }, []);

  const stopStepLoop = React.useCallback(() => {
    stepLoopRef.current?.stop();
    stepLoopRef.current = null;
    stopFrameLoop();
  }, [stopFrameLoop]);

  const startFrameLoop = React.useCallback((pace: Pace) => {
    stopFrameLoop();
    const { stepMs } = PACE[pace];
    frameTimerRef.current = setInterval(() => {
      setFrameIndex((index) => (index + 1) % FRAME_COUNT);
    }, stepMs);
  }, [stopFrameLoop]);

  const startStepLoop = React.useCallback(
    (pace: Pace) => {
      stopStepLoop();
      step.setValue(0);
      const { stepMs } = PACE[pace];
      startFrameLoop(pace);
      stepLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(step, {
            toValue: 1,
            duration: stepMs,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(step, {
            toValue: 0,
            duration: stepMs,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      stepLoopRef.current.start();
    },
    [startFrameLoop, step, stopStepLoop],
  );

  const animatePaceVisual = React.useCallback(
    (pace: Pace) => {
      const target =
        pace === 'dash' ? 1 : pace === 'amble' ? -1 : 0;
      Animated.spring(paceAnim, {
        toValue: target,
        friction: 7,
        tension: pace === 'dash' ? 120 : 40,
        useNativeDriver: true,
      }).start();
    },
    [paceAnim],
  );

  const runWalkLegRef = React.useRef<() => void>(() => {});

  const runWalkLeg = React.useCallback(() => {
    if (!walkActiveRef.current) return;

    const pace = paceRef.current;
    const { walkMs } = PACE[pace];
    const goingRight = directionRef.current === 'right';
    const target = goingRight ? 1 : 0;

    travel.stopAnimation((value) => {
      const remaining = Math.abs(target - value);
      const duration = Math.max(280, walkMs * remaining);

      Animated.parallel([
        Animated.timing(facing, {
          toValue: goingRight ? 1 : -1,
          duration: 1,
          useNativeDriver: true,
        }),
        Animated.timing(travel, {
          toValue: target,
          duration,
          easing: pace === 'dash' ? Easing.out(Easing.cubic) : Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || !walkActiveRef.current) return;
        directionRef.current = goingRight ? 'left' : 'right';
        runWalkLegRef.current();
      });
    });
  }, [facing, travel]);

  React.useEffect(() => {
    runWalkLegRef.current = runWalkLeg;
  }, [runWalkLeg]);

  const setPace = React.useCallback(
    (pace: Pace) => {
      const changed = paceRef.current !== pace;
      paceRef.current = pace;
      animatePaceVisual(pace);
      startStepLoop(pace);
      if (changed) runWalkLeg();
    },
    [animatePaceVisual, runWalkLeg, startStepLoop],
  );

  const boostToDash = React.useCallback(() => {
    if (dashTimerRef.current) clearTimeout(dashTimerRef.current);
    setPace('dash');
    dashTimerRef.current = setTimeout(() => {
      setPace('stroll');
      dashTimerRef.current = null;
    }, DASH_HOLD_MS);
  }, [setPace]);

  React.useEffect(() => {
    const listenerId = travel.addListener(({ value }) => {
      pigeonXRef.current = minX + value * (maxX - minX);
    });
    pigeonXRef.current = minX;

    return () => {
      travel.removeListener(listenerId);
    };
  }, [maxX, minX, travel]);

  React.useEffect(() => {
    walkActiveRef.current = true;
    startStepLoop('stroll');
    runWalkLeg();

    ambleTimerRef.current = setInterval(() => {
      if (paceRef.current === 'dash') return;
      setPace(paceRef.current === 'stroll' ? 'amble' : 'stroll');
    }, AMBLE_EVERY_MS);

    return () => {
      walkActiveRef.current = false;
      stopStepLoop();
      travel.stopAnimation();
      facing.stopAnimation();
      paceAnim.stopAnimation();
      if (dashTimerRef.current) clearTimeout(dashTimerRef.current);
      if (ambleTimerRef.current) clearInterval(ambleTimerRef.current);
    };
  }, [facing, laneWidth, paceAnim, runWalkLeg, setPace, startStepLoop, stopStepLoop, travel]);

  const translateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [minX, maxX],
  });

  const bobY = Animated.multiply(
    step.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -1, 0],
    }),
    paceAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [PACE.amble.bob, PACE.stroll.bob, PACE.dash.bob],
    }),
  );

  const hitOpacity = paceAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [PACE.amble.opacity, PACE.stroll.opacity, PACE.dash.opacity],
  });

  const handlePress = React.useCallback(() => {
    void hapticLight();
    void playPigeonTab();
    boostToDash();
    const jitter = (Math.random() - 0.5) * 8;
    const rearX =
      directionRef.current === 'right'
        ? pigeonXRef.current + 6
        : pigeonXRef.current + MARK_SIZE - POOP_SIZE - 6;
    onTap(rearX + jitter);
  }, [boostToDash, onTap]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.pigeon,
        {
          transform: [
            { translateX },
            { translateY: bobY },
            { scaleX: facing },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="よちよち歩きのハト"
        accessibilityHint="タップで鳴いてダッシュしてうんこする"
        hitSlop={12}
        onPress={handlePress}
      >
        <Animated.View style={[styles.hit, { opacity: hitOpacity }]}>
          <Image
            source={WANDER_PIGEON_FRAMES[frameIndex]}
            style={styles.sprite}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** よちよち歩きのブランド鳩（タップでダッシュ・うんこ・自動で緩急） */
export function AmbientPigeonsLayer() {
  const { width } = useWindowDimensions();
  const [poops, setPoops] = React.useState<PoopSpot[]>([]);
  const poopIdRef = React.useRef(0);

  const handlePigeonTap = React.useCallback((centerX: number) => {
    const id = ++poopIdRef.current;
    setPoops((prev) => {
      const next = [...prev, { id, x: centerX }];
      if (next.length <= MAX_POOPS) return next;
      return next.slice(next.length - MAX_POOPS);
    });
  }, []);

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {poops.map((poop) => (
        <DroppedPoop key={poop.id} x={poop.x} />
      ))}
      <WaddlingPigeon laneWidth={width} onTap={handlePigeonTap} />
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
    height: SPRITE_HEIGHT,
  },
  hit: {
    width: MARK_SIZE,
    height: SPRITE_HEIGHT,
  },
  sprite: {
    width: MARK_SIZE,
    height: SPRITE_HEIGHT,
  },
  poop: {
    position: 'absolute',
    bottom: BOTTOM - 6,
    width: POOP_SIZE,
    height: POOP_SIZE,
  },
});
