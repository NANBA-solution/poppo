import * as React from 'react';
import Svg, { Ellipse } from 'react-native-svg';

type Props = {
  size: number;
};

/** ハトのうんこ（白緑・積み上げドロップ） */
export function PoopMark({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 28">
      <Ellipse cx="12" cy="22" rx="8" ry="5" fill="#D8E6D0" />
      <Ellipse cx="12" cy="16" rx="6" ry="5" fill="#C8DABF" />
      <Ellipse cx="12" cy="10" rx="4.5" ry="4" fill="#B8CEAA" />
      <Ellipse cx="12" cy="5" rx="3" ry="3" fill="#F2F6EC" />
    </Svg>
  );
}
