import { colors } from '@/theme/tokens';
import * as React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type Props = {
  size: number;
};

/**
 * POPPO ブランド鳩（サングラス＋パン）— 正面バスト。
 * アイコン／avatar-pigeon と同じ文法で一目でハトとわかる。
 */
export function PoppoPigeonMark({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 96">
      {/* 体 */}
      <Ellipse cx="40" cy="62" rx="26" ry="22" fill="#B5AFA4" />
      <Ellipse cx="40" cy="58" rx="22" ry="16" fill="#C8C2B8" />
      {/* 首の虹色 */}
      <Ellipse cx="40" cy="46" rx="16" ry="5" fill={colors.accentPurple} opacity={0.85} />
      {/* 頭 */}
      <Circle cx="40" cy="30" r="17" fill="#C4BEB4" />
      <Circle cx="40" cy="32" r="14" fill="#D8D2C8" />
      {/* サングラス */}
      <Rect x="24" y="27" width="13" height="7" rx="2" fill={colors.ink} />
      <Rect x="43" y="27" width="13" height="7" rx="2" fill={colors.ink} />
      <Rect x="36.5" y="29" width="7" height="2" rx="1" fill={colors.ink} />
      {/* くちばし＋パン */}
      <Path d="M40 36 L40 40 L48 39 L40 36Z" fill="#4A4A4A" />
      <Rect x="46" y="36" width="14" height="5" rx="1.5" fill="#C4A574" />
      <Rect x="46" y="36" width="14" height="2" rx="1" fill="#E8D4A8" opacity={0.6} />
      {/* 羽の影 */}
      <Ellipse cx="22" cy="58" rx="9" ry="6" fill="#9E9890" opacity={0.55} />
      <Ellipse cx="58" cy="58" rx="9" ry="6" fill="#9E9890" opacity={0.55} />
    </Svg>
  );
}
