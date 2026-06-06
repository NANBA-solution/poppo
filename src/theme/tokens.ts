/** POPPO アイコン準拠 — クリーム × 黒のモダン UI */
export const colors = {
  bg: '#F5F1EA',
  bgElevated: '#EDE8DF',
  surface: '#FFFFFF',
  surfaceSolid: '#FFFFFF',
  surfaceHover: '#F8F6F2',
  surfaceHoverSolid: '#F0ECE4',
  border: 'rgba(26,26,26,0.08)',
  borderStrong: 'rgba(26,26,26,0.14)',
  text: '#1A1A1A',
  textMuted: '#6B6560',
  accent: '#1A1A1A',
  accentSoft: 'rgba(26,26,26,0.05)',
  accentBright: '#1A1A1A',
  accentPurple: '#6B5B95',
  gold: '#1A1A1A',
  goldSoft: 'rgba(26,26,26,0.06)',
  danger: '#B42318',
  dangerSoft: 'rgba(180,35,24,0.08)',
  success: '#2D6A4F',
  pillSolid: '#FFFFFF',
  onAccent: '#FFFFFF',
  cameraBg: '#111111',
  ink: '#1A1A1A',
  paper: '#F5F1EA',
  cloud: '#FFFFFF',
  city: '#4A4A4A',
  ground: '#8B7D6B',
  glow: 'rgba(255,255,255,0.72)',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
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
    letterSpacing: -0.5,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
} as const;

export const shadow = {
  floating: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  subtle: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
} as const;

export const borders = {
  thin: 1,
  medium: 1,
  thick: 2,
} as const;
