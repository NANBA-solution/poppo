import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/tokens';
import type { CardRarity } from '@/types/collection';
import { formatScanLabel } from '@/utils/scanLabel';
import { toHoloCardRarity } from '@/utils/holoCardRarity';
import { isPoppoCardsNativeAvailable } from '@/utils/nativeAvailability';
import {
  buildMoveSeed,
  generateCardMoves,
} from '@/utils/cardMoveGenerator';
import {
  getCardAttackDamage,
  getCardPowerStars,
  getRarityFlavor,
  getRarityLabel,
} from '@/utils/rarityLabel';
import { LinearGradient } from 'expo-linear-gradient';
import { PoppoHoloCardView } from 'poppo-cards';
import * as React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, Line, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

type PigeonCardSize = 'grid' | 'detail' | 'share';

type PigeonCardProps = {
  imageUri: string;
  scanNo: number;
  rarity: CardRarity;
  flavorIndex: number;
  entryId?: string;
  size?: PigeonCardSize;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

type RarityFinish = {
  frame: readonly [string, string, string, ...string[]];
  frameShadow: string;
  plate: readonly [string, string, ...string[]];
  accent: string;
  accentBright: string;
  accentSoftBg: string;
  ink: string;
  muted: string;
  paper: readonly [string, string, ...string[]];
  holoBands: readonly (readonly [string, string, ...string[]])[];
  dark?: boolean;
};

const FINISH: Record<CardRarity, RarityFinish> = {
  N: {
    frame: ['#6E6458', '#C4B8A8', '#F0EAE0', '#B8AA98', '#5A5248'],
    frameShadow: '#3D3832',
    plate: ['#E8E2D8', '#F8F4EC', '#DDD6CA'],
    accent: '#6B5E4E',
    accentBright: '#9A8B78',
    accentSoftBg: 'rgba(107,94,78,0.2)',
    ink: colors.ink,
    muted: colors.textMuted,
    paper: ['#FAF7F2', '#F2EDE4', '#E8E2D8'],
    holoBands: [],
  },
  R: {
    frame: ['#4A5A6A', '#A8B8C8', '#E8F0F8', '#8A9AAA', '#3A4858'],
    frameShadow: '#2A3440',
    plate: ['#D8E4EE', '#F0F6FA', '#C8D8E4'],
    accent: '#4A6278',
    accentBright: '#7A94AC',
    accentSoftBg: 'rgba(74,98,120,0.18)',
    ink: colors.ink,
    muted: '#5A6A78',
    paper: ['#F6FAFC', '#EAF0F4', '#DEE8EE'],
    holoBands: [
      ['rgba(180,210,240,0)', 'rgba(200,225,255,0.35)', 'rgba(255,255,255,0.15)', 'rgba(180,210,240,0)'],
      ['rgba(255,255,255,0)', 'rgba(160,190,220,0.25)', 'rgba(255,255,255,0)'],
    ],
  },
  SR: {
    frame: ['#6A4E10', '#D4AF37', '#FFF0C0', '#C9A227', '#4A3808'],
    frameShadow: '#2A2008',
    plate: ['#E8D080', '#FFF4C8', '#D4B050'],
    accent: '#8A6808',
    accentBright: '#D4AF37',
    accentSoftBg: 'rgba(138,104,8,0.2)',
    ink: '#2A2008',
    muted: '#6A5830',
    paper: ['#FFF8E8', '#F8EED0', '#F0E4B8'],
    holoBands: [
      ['rgba(255,220,120,0)', 'rgba(255,200,80,0.45)', 'rgba(255,255,200,0.2)', 'rgba(255,180,60,0)'],
      ['rgba(255,255,255,0)', 'rgba(255,230,150,0.3)', 'rgba(255,200,100,0.15)', 'rgba(255,255,255,0)'],
      ['rgba(200,160,60,0)', 'rgba(255,240,180,0.35)', 'rgba(200,160,60,0)'],
    ],
  },
  UR: {
    frame: ['#3A2860', '#9070D0', '#E8D8FF', '#7050B0', '#281848'],
    frameShadow: '#181028',
    plate: ['#C8B0F0', '#F0E8FF', '#A890E0'],
    accent: '#5A4090',
    accentBright: '#9070D0',
    accentSoftBg: 'rgba(90,64,144,0.2)',
    ink: '#1E1438',
    muted: '#5A4878',
    paper: ['#F4EEFF', '#E8DEFF', '#DDD0F8'],
    holoBands: [
      ['rgba(180,140,255,0)', 'rgba(200,160,255,0.5)', 'rgba(255,220,255,0.2)', 'rgba(140,100,220,0)'],
      ['rgba(255,255,255,0)', 'rgba(180,140,255,0.35)', 'rgba(100,200,255,0.2)', 'rgba(255,255,255,0)'],
      ['rgba(100,180,255,0)', 'rgba(220,180,255,0.3)', 'rgba(100,180,255,0)'],
    ],
  },
  SECRET: {
    frame: ['#0A0A0A', '#D4AF37', '#2D6A4F', '#C9A227', '#050505'],
    frameShadow: '#000000',
    plate: ['#1A1A1A', '#2A2820', '#121210'],
    accent: '#D4AF37',
    accentBright: '#95D5B2',
    accentSoftBg: 'rgba(212,175,55,0.15)',
    ink: '#F5F1EA',
    muted: 'rgba(245,241,234,0.55)',
    paper: ['#1E1E1C', '#161614', '#10100E'],
    holoBands: [
      ['rgba(212,175,55,0.08)', 'rgba(149,213,178,0.35)', 'rgba(212,175,55,0.08)'],
      ['rgba(255,255,255,0)', 'rgba(212,175,55,0.25)', 'rgba(45,106,79,0.2)', 'rgba(255,255,255,0)'],
      ['rgba(45,106,79,0)', 'rgba(212,175,55,0.3)', 'rgba(45,106,79,0)'],
    ],
    dark: true,
  },
};

const LAYOUT = {
  grid: { frame: 5, gap: 3, name: 10, sub: 7, artFlex: 1.35, showMove2: false, showMoveDesc: false, flavorLines: 1 },
  detail: { frame: 6, gap: 4, name: 12, sub: 9, artFlex: 1.25, showMove2: true, showMoveDesc: true, flavorLines: 2 },
  share: { frame: 7, gap: 5, name: 15, sub: 11, artFlex: 1.28, showMove2: true, showMoveDesc: true, flavorLines: 2 },
} as const;

function HoloBands({ bands }: { bands: RarityFinish['holoBands'] }) {
  if (bands.length === 0) return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {bands.map((colors, i) => (
        <LinearGradient
          key={i}
          colors={colors}
          start={{ x: 0, y: i * 0.3 }}
          end={{ x: 1, y: 0.7 + i * 0.2 }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.55 + i * 0.08 }]}
        />
      ))}
    </View>
  );
}

function HoloLines({ accent, id }: { accent: string; id: string }) {
  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="transparent" />
          <Stop offset="45%" stopColor={accent} stopOpacity={0.35} />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="transparent" />
        </SvgGradient>
      </Defs>
      {Array.from({ length: 14 }, (_, i) => (
        <Line
          key={i}
          x1={`${-20 + i * 12}%`}
          y1="0%"
          x2={`${30 + i * 12}%`}
          y2="100%"
          stroke={`url(#${id})`}
          strokeWidth={1.2}
          opacity={0.55}
        />
      ))}
    </Svg>
  );
}

function PaperGrain({ dark }: { dark?: boolean }) {
  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none" opacity={dark ? 0.12 : 0.06}>
      {Array.from({ length: 24 }, (_, i) => (
        <Line
          key={`h${i}`}
          x1="0"
          y1={`${(i * 100) / 24}%`}
          x2="100%"
          y2={`${(i * 100) / 24}%`}
          stroke={dark ? '#FFFFFF' : '#8B7D6B'}
          strokeWidth={0.4}
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <Line
          key={`v${i}`}
          x1={`${(i * 100) / 16}%`}
          y1="0"
          x2={`${(i * 100) / 16}%`}
          y2="100%"
          stroke={dark ? '#FFFFFF' : '#8B7D6B'}
          strokeWidth={0.35}
        />
      ))}
    </Svg>
  );
}

function CardPaper({ finish }: { finish: RarityFinish }) {
  return (
    <>
      <LinearGradient colors={finish.paper} style={StyleSheet.absoluteFillObject} />
      <PaperGrain dark={finish.dark} />
      <LinearGradient
        colors={finish.dark ? ['rgba(255,255,255,0.04)', 'transparent'] : ['rgba(255,255,255,0.7)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </>
  );
}

function Stars({ count, size, bright, dim }: { count: number; size: number; bright: string; dim: string }) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < count ? bright : dim, lineHeight: size + 2 }}>
          {i < count ? '★' : '·'}
        </Text>
      ))}
    </View>
  );
}

export function PigeonCard({
  imageUri,
  scanNo,
  rarity,
  flavorIndex,
  entryId,
  size = 'grid',
  style,
  onPress,
}: PigeonCardProps) {
  const { t, locale } = useI18n();
  const finish = FINISH[rarity];
  const layout = LAYOUT[size];
  const label = getRarityLabel(rarity, t);
  const flavor = getRarityFlavor(rarity, flavorIndex, t);
  const powerStars = getCardPowerStars(rarity, scanNo);
  const name = formatScanLabel(scanNo, t);
  const serial = `${t.card.serial}${String(scanNo).padStart(3, '0')}`;
  const moveSeed = buildMoveSeed(entryId, scanNo, flavorIndex);
  const [move1, move2] = generateCardMoves({ seed: moveSeed, locale, rarity });
  const dmg1 = getCardAttackDamage(rarity, scanNo, 1);
  const dmg2 = getCardAttackDamage(rarity, scanNo, 2);
  const holoId = `holo-${entryId ?? scanNo}`;
  const hasHolo = finish.holoBands.length > 0;

  const useNativeHolo = Platform.OS === 'ios' && isPoppoCardsNativeAvailable();

  if (useNativeHolo) {
    const holoCard = (
      <View style={[styles.shell, style]}>
        <PoppoHoloCardView
          imageUri={imageUri}
          rarity={toHoloCardRarity(rarity)}
          cardName={name}
          rarityLabel={label}
          serial={serial}
          starCount={powerStars}
          move1Name={move1.name}
          move1Damage={String(dmg1)}
          move2Name={move2.name}
          move2Damage={String(dmg2)}
          moveDescription={move1.desc}
          flavor={flavor}
          showMove2={layout.showMove2}
          showMoveDesc={layout.showMoveDesc}
          layout="single"
        />
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${name}`}
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          {holoCard}
        </Pressable>
      );
    }

    return holoCard;
  }

  const content = (
    <View style={[styles.shell, style]}>
      <View style={[styles.dropShadow, { shadowColor: finish.frameShadow }]} />
      <View style={[styles.cardLift, { shadowColor: finish.frameShadow }]}>
        <LinearGradient
          colors={finish.frame}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.metalFrame, { padding: layout.frame }]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(0,0,0,0.55)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.frameSpecular}
            pointerEvents="none"
          />

          <View style={styles.frameInset}>
            <View style={[styles.face, styles.whiteBezel, { gap: layout.gap }]}>
              <CardPaper finish={finish} />

              <View style={styles.topRow}>
                <View style={[styles.rarityGem, { borderColor: finish.accent, backgroundColor: finish.accentSoftBg }]}>
                  <Text style={[styles.rarityGemText, { color: finish.accent }]}>{label}</Text>
                </View>
                <Text style={[styles.serial, { color: finish.muted, fontSize: layout.sub - 1 }]}>{serial}</Text>
                <Stars
                  count={powerStars}
                  size={layout.sub}
                  bright={finish.accentBright}
                  dim={finish.dark ? 'rgba(245,241,234,0.2)' : 'rgba(0,0,0,0.15)'}
                />
              </View>

              <View style={[styles.artSection, { flex: layout.artFlex }]}>
                <View
                  style={[
                    styles.artRecess,
                    {
                      borderTopColor: finish.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.25)',
                      borderLeftColor: finish.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)',
                      borderBottomColor: finish.dark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.6)',
                      borderRightColor: finish.dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <View style={styles.artInner}>
                    <Image source={{ uri: imageUri }} style={styles.art} resizeMode="cover" accessibilityLabel={name} />
                    {hasHolo ? <HoloBands bands={finish.holoBands} /> : null}
                    {hasHolo ? <HoloLines accent={finish.accentBright} id={holoId} /> : null}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'transparent', 'rgba(0,0,0,0.15)']}
                      locations={[0, 0.4, 1]}
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    />
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={finish.plate}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.nameBar,
                  {
                    borderColor: finish.accent,
                    borderTopColor: finish.dark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                    borderBottomColor: finish.dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)',
                  },
                ]}
              >
                <Text style={[styles.cardName, { color: finish.ink, fontSize: layout.name }]} numberOfLines={1}>
                  {name}
                </Text>
              </LinearGradient>

              <View
                style={[
                  styles.textBox,
                  {
                    borderTopColor: finish.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.14)',
                    borderLeftColor: finish.dark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.1)',
                    borderBottomColor: finish.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                    borderRightColor: finish.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)',
                    backgroundColor: finish.dark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)',
                  },
                ]}
              >
                <View style={styles.attackRow}>
                  <Text style={[styles.moveLine, { color: finish.ink, fontSize: layout.sub, flex: 1 }]} numberOfLines={1}>
                    <Text style={{ color: finish.accent, fontWeight: '900' }}>{move1.name}</Text>
                  </Text>
                  <Text style={[styles.damage, { color: finish.ink, fontSize: layout.sub }]}>{dmg1}</Text>
                </View>
                {layout.showMove2 ? (
                  <View style={styles.attackRow}>
                    <Text style={[styles.moveLine, { color: finish.ink, fontSize: layout.sub, flex: 1 }]} numberOfLines={1}>
                      <Text style={{ color: finish.accent, fontWeight: '900' }}>{move2.name}</Text>
                    </Text>
                    <Text style={[styles.damage, { color: finish.ink, fontSize: layout.sub }]}>
                      {dmg2}
                    </Text>
                  </View>
                ) : null}
                {layout.showMoveDesc ? (
                  <Text style={[styles.moveDesc, { color: finish.muted, fontSize: layout.sub - 1 }]} numberOfLines={2}>
                    {move1.desc}
                  </Text>
                ) : null}
                <View style={[styles.ruleLine, { backgroundColor: finish.accentSoftBg }]} />
                <Text
                  style={[styles.flavor, { color: finish.muted, fontSize: layout.sub - 1 }]}
                  numberOfLines={layout.flavorLines}
                >
                  {flavor}
                </Text>
              </View>

              {hasHolo ? (
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'transparent', 'rgba(255,255,255,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.foilWash}
                  pointerEvents="none"
                />
              ) : null}

              <LinearGradient
                colors={['rgba(255,255,255,0.28)', 'transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0.45 }}
                style={styles.laminate}
                pointerEvents="none"
              />
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={[finish.frameShadow, 'transparent']}
          style={styles.cardEdge}
          pointerEvents="none"
        />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${name}`}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 5 / 7,
  },
  dropShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  cardLift: {
    flex: 1,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  metalFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  frameSpecular: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  frameInset: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.65)',
    overflow: 'hidden',
  },
  face: {
    flex: 1,
    padding: 4,
    overflow: 'hidden',
  },
  whiteBezel: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    zIndex: 2,
  },
  artSection: {
    minHeight: 0,
  },
  artRecess: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 2,
    padding: 2,
    backgroundColor: '#0A0A0A',
  },
  artInner: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  nameBar: {
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    zIndex: 2,
  },
  rarityGem: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rarityGemText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  cardName: {
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  serial: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.4,
    flex: 1,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  textBox: {
    borderRadius: 5,
    borderWidth: 1.5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 3,
    flex: 1,
    minHeight: 0,
    zIndex: 2,
  },
  attackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moveLine: {
    fontWeight: '700',
    lineHeight: 14,
  },
  damage: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 22,
    textAlign: 'right',
  },
  ruleLine: {
    height: 1,
    marginVertical: 1,
  },
  moveDesc: {
    lineHeight: 11,
    fontStyle: 'italic',
  },
  flavor: {
    lineHeight: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  foilWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  laminate: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  cardEdge: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: -2,
    height: 4,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.985 }],
  },
});
