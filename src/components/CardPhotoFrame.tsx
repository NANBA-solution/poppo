import {
  clampCardImageFraming,
  computeCardPhotoLayout,
  DEFAULT_CARD_IMAGE_FRAMING,
  normalizeCardImageFraming,
} from '@/utils/cardImageFraming';
import type { CardImageFraming } from '@/types/collection';
import * as React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type CardPhotoFrameProps = {
  uri: string;
  framing?: Partial<CardImageFraming> | null;
  editable?: boolean;
  onFramingChange?: (framing: CardImageFraming) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: React.ReactNode;
};

function touchDistance(
  a: { pageX: number; pageY: number },
  b: { pageX: number; pageY: number },
): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export function CardPhotoFrame({
  uri,
  framing,
  editable = false,
  onFramingChange,
  accessibilityLabel,
  style,
  imageStyle,
  children,
}: CardPhotoFrameProps) {
  const normalized = normalizeCardImageFraming(framing);
  const [frameSize, setFrameSize] = React.useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
  const framingRef = React.useRef(normalized);
  const panBase = React.useRef({ x: normalized.offsetX, y: normalized.offsetY });
  const pinchBase = React.useRef(normalized.scale);
  const panStart = React.useRef({ x: 0, y: 0 });
  const pinchStartDistance = React.useRef(0);

  React.useEffect(() => {
    framingRef.current = normalized;
  }, [normalized]);

  React.useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (width, height) => {
        if (active) setImageSize({ width, height });
      },
      () => {
        if (active) setImageSize({ width: 0, height: 0 });
      },
    );
    return () => {
      active = false;
    };
  }, [uri]);

  const emitFraming = React.useCallback(
    (next: CardImageFraming) => {
      const clamped =
        frameSize.width > 0 &&
        frameSize.height > 0 &&
        imageSize.width > 0 &&
        imageSize.height > 0
          ? clampCardImageFraming(next, frameSize.width, frameSize.height, imageSize.width, imageSize.height)
          : normalizeCardImageFraming(next);
      framingRef.current = clamped;
      onFramingChange?.(clamped);
    },
    [frameSize.height, frameSize.width, imageSize.height, imageSize.width, onFramingChange],
  );

  const handleGrant = React.useCallback((event: GestureResponderEvent) => {
    const current = framingRef.current;
    panBase.current = { x: current.offsetX, y: current.offsetY };
    pinchBase.current = current.scale;

    const touches = event.nativeEvent.touches;
    if (touches.length === 1) {
      panStart.current = { x: touches[0].pageX, y: touches[0].pageY };
    } else if (touches.length >= 2) {
      pinchStartDistance.current = touchDistance(touches[0], touches[1]);
    }
  }, []);

  const handleMove = React.useCallback(
    (event: GestureResponderEvent) => {
      const { width, height } = frameSize;
      if (width <= 0 || height <= 0) return;

      const touches = event.nativeEvent.touches;
      if (touches.length >= 2 && pinchStartDistance.current > 0) {
        const distance = touchDistance(touches[0], touches[1]);
        emitFraming({
          ...framingRef.current,
          scale: pinchBase.current * (distance / pinchStartDistance.current),
        });
        return;
      }

      if (touches.length === 1) {
        const dx = touches[0].pageX - panStart.current.x;
        const dy = touches[0].pageY - panStart.current.y;
        emitFraming({
          ...framingRef.current,
          offsetX: panBase.current.x + (dx / width) * 2,
          offsetY: panBase.current.y + (dy / height) * 2,
        });
      }
    },
    [emitFraming, frameSize],
  );

  const photoStyle = React.useMemo<ImageStyle>(() => {
    const { width: frameWidth, height: frameHeight } = frameSize;
    const { width: imageWidth, height: imageHeight } = imageSize;
    if (frameWidth <= 0 || frameHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
      return StyleSheet.absoluteFillObject;
    }
    const layout = computeCardPhotoLayout(
      frameWidth,
      frameHeight,
      imageWidth,
      imageHeight,
      normalized,
    );
    return {
      position: 'absolute',
      width: layout.width,
      height: layout.height,
      left: layout.left,
      top: layout.top,
    };
  }, [frameSize, imageSize, normalized]);

  return (
    <View
      style={[styles.clip, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setFrameSize({ width, height });
      }}
      {...(editable
        ? {
            onStartShouldSetResponder: () => true,
            onMoveShouldSetResponder: () => true,
            onResponderTerminationRequest: () => false,
            onResponderGrant: handleGrant,
            onResponderMove: handleMove,
          }
        : undefined)}
    >
      <Image
        source={{ uri }}
        style={[photoStyle, imageStyle]}
        resizeMode="stretch"
        accessibilityLabel={accessibilityLabel}
      />
      {children ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
});

export { DEFAULT_CARD_IMAGE_FRAMING };
