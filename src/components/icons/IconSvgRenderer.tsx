import type { IconGlyph } from '@/components/icons/iconGlyphs';
import * as React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type Props = {
  glyph: IconGlyph;
  size: number;
  color: string;
};

const STROKE = 2;
const VIEW = 24;

export function IconSvgRenderer({ glyph, size, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none">
      {glyph.rects?.map((r, i) => (
        <Rect
          key={`r-${i}`}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          rx={r.rx}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {glyph.circles?.map((c, i) => (
        <Circle
          key={`c-${i}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          stroke={c.fill ? undefined : color}
          strokeWidth={c.fill ? undefined : STROKE}
          fill={c.fill ? color : undefined}
        />
      ))}
      {glyph.lines?.map((l, i) => (
        <Line
          key={`l-${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      ))}
      {glyph.paths.map((p, i) => (
        <Path
          key={`p-${i}`}
          d={p.d}
          fill={p.fill ? color : undefined}
          stroke={p.fill ? undefined : color}
          strokeWidth={p.fill ? undefined : STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
