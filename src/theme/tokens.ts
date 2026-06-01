/** モダンダーク UI — バイオレットアクセント */
export const colors = {
  bg: '#09090b',
  bgElevated: '#131318',
  surface: 'rgba(28,28,36,0.92)',
  surfaceSolid: '#1c1c24',
  surfaceHover: 'rgba(38,38,48,0.96)',
  surfaceHoverSolid: '#26262f',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(167,139,250,0.4)',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  accent: '#a78bfa',
  accentSoft: 'rgba(167,139,250,0.14)',
  accentBright: '#c4b5fd',
  gold: '#fbbf24',
  goldSoft: 'rgba(251,191,36,0.12)',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  success: '#4ade80',
  pillSolid: '#141419',
  onAccent: '#1e1033',
  cameraBg: '#000000',
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 2.4,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
} as const;

export const shadow = {
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
