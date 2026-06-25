import { CardPhotoFrame } from '@/components/CardPhotoFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { CARD_NAME_FONT_FAMILY } from '@/theme/cardFonts';
import { colors } from '@/theme/tokens';
import type { CardImageFraming, CardRarity } from '@/types/collection';
import {
  normalizeCardImageFraming,
} from '@/utils/cardImageFraming';
import { formatScanLabel } from '@/utils/scanLabel';
import { toHoloCardRarity } from '@/utils/holoCardRarity';
import { isPoppoCardsNativeAvailable } from '@/utils/nativeAvailability';
import {
  buildMoveSeed,
  generateCardMoves,
} from '@/utils/cardMoveGenerator';
import {
  getCardAttackDamage,
  getCardHp,
  getCardPowerStars,
  getCardRetreatCost,
  getRarityFlavor,
  getRarityLabel,
} from '@/utils/rarityLabel';
import { LinearGradient } from 'expo-linear-gradient';
import { PoppoHoloCardView, isPoppoHoloCardViewAvailable } from 'poppo-cards';
import * as React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Ellipse, G, Line } from 'react-native-svg';

type PigeonCardSize = 'grid' | 'detail' | 'share';

type PigeonCardProps = {
  imageUri: string;
  scanNo: number;
  rarity: CardRarity;
  flavorIndex: number;
  entryId?: string;
  imageFraming?: Partial<CardImageFraming> | null;
  framingEditable?: boolean;
  onImageFramingChange?: (framing: CardImageFraming) => void;
  size?: PigeonCardSize;
  isActive?: boolean;
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
  textBox?: readonly [string, string, ...string[]];
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
    textBox: ['#FFFDF9', '#F7F2EA'],
    holoBands: [],
  },
  R: {
    frame: ['#1A2430', '#3A4A5C', '#6A8098', '#E8F0F8', '#526478', '#243040'],
    frameShadow: '#141C28',
    plate: ['#D8E4EE', '#F0F6FA', '#C8D8E4'],
    accent: '#4A6278',
    accentBright: '#7A94AC',
    accentSoftBg: 'rgba(74,98,120,0.18)',
    ink: colors.ink,
    muted: '#5A6A78',
    paper: ['#F6FAFC', '#EAF0F4', '#DEE8EE'],
    textBox: ['#F8FBFD', '#EEF4F8'],
    holoBands: [
      ['rgba(180,210,255,0.05)', 'rgba(220,235,255,0.55)', 'rgba(255,255,255,0.35)', 'rgba(180,210,255,0.05)'],
      ['rgba(255,255,255,0)', 'rgba(160,200,255,0.45)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)'],
      ['rgba(120,170,220,0)', 'rgba(200,225,255,0.4)', 'rgba(120,170,220,0)'],
    ],
  },
  SR: {
    frame: ['#2E2208', '#6B4E0C', '#D4AF37', '#FFF4C8', '#A67C0A', '#3A2A06'],
    frameShadow: '#1A1406',
    plate: ['#E8D080', '#FFF4C8', '#D4B050'],
    accent: '#8A6808',
    accentBright: '#D4AF37',
    accentSoftBg: 'rgba(138,104,8,0.2)',
    ink: colors.ink,
    muted: colors.textMuted,
    paper: ['#FFF8E8', '#F8EED0', '#F0E4B8'],
    textBox: ['#FFFBF0', '#F8EFD4'],
    holoBands: [
      ['rgba(255,220,80,0.08)', 'rgba(255,210,60,0.65)', 'rgba(255,255,220,0.35)', 'rgba(255,180,40,0.08)'],
      ['rgba(255,255,255,0)', 'rgba(255,240,160,0.5)', 'rgba(255,200,80,0.28)', 'rgba(255,255,255,0)'],
      ['rgba(255,200,60,0)', 'rgba(255,245,180,0.5)', 'rgba(255,200,60,0)'],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0)'],
    ],
  },
  UR: {
    frame: ['#14082A', '#3A1E66', '#7B52C4', '#D8C4FF', '#5A38A0', '#1E1038'],
    frameShadow: '#0C0618',
    plate: ['#C8B0F0', '#F0E8FF', '#A890E0'],
    accent: '#5A4090',
    accentBright: '#9070D0',
    accentSoftBg: 'rgba(90,64,144,0.2)',
    ink: colors.ink,
    muted: '#3A3832',
    paper: ['#F4EEFF', '#E8DEFF', '#DDD0F8'],
    textBox: ['#F9F5FF', '#EEE4FF'],
    holoBands: [
      ['rgba(180,140,255,0.08)', 'rgba(210,170,255,0.7)', 'rgba(255,230,255,0.38)', 'rgba(140,100,220,0.08)'],
      ['rgba(255,255,255,0)', 'rgba(190,150,255,0.5)', 'rgba(120,200,255,0.32)', 'rgba(255,255,255,0)'],
      ['rgba(100,180,255,0)', 'rgba(230,190,255,0.45)', 'rgba(100,180,255,0)'],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)'],
    ],
  },
  SECRET: {
    frame: ['#0A0A0A', '#FFD700', '#2D8A5F', '#E8C040', '#050505'],
    frameShadow: '#000000',
    plate: ['#F7F4EA', '#ECE4D0', '#DDD2B8'],
    accent: '#8A6808',
    accentBright: '#2D6A4F',
    accentSoftBg: 'rgba(212,175,55,0.2)',
    ink: colors.ink,
    muted: '#3A3832',
    paper: ['#FAF8F2', '#F3EEDF', '#EBE4D2'],
    textBox: ['#FFFDF8', '#F5F0E2'],
    holoBands: [
      ['rgba(212,175,55,0.12)', 'rgba(149,213,178,0.55)', 'rgba(255,230,140,0.35)', 'rgba(212,175,55,0.12)'],
      ['rgba(255,255,255,0)', 'rgba(212,175,55,0.45)', 'rgba(45,140,90,0.3)', 'rgba(255,255,255,0)'],
      ['rgba(45,106,79,0)', 'rgba(255,230,150,0.45)', 'rgba(45,106,79,0)'],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)'],
    ],
  },
};

const LAYOUT = {
  grid: {
    frame: 5,
    gap: 2,
    name: 9,
    sub: 6,
    meta: 5,
    artFlex: 1.08,
    showMove2: true,
    showMoveDesc: false,
    showMove2Desc: false,
    showMeta: true,
    showProfile: false,
    showStats: true,
    showCosts: false,
    showBrand: true,
    flavorLines: 1,
  },
  detail: {
    frame: 6,
    gap: 3,
    name: 11,
    sub: 8,
    meta: 6,
    artFlex: 1.05,
    showMove2: true,
    showMoveDesc: true,
    showMove2Desc: true,
    showMeta: true,
    showProfile: true,
    showStats: true,
    showCosts: false,
    showBrand: true,
    flavorLines: 3,
  },
  share: {
    frame: 7,
    gap: 4,
    name: 14,
    sub: 10,
    meta: 7,
    artFlex: 1.08,
    showMove2: true,
    showMoveDesc: true,
    showMove2Desc: true,
    showMeta: true,
    showProfile: true,
    showStats: true,
    showCosts: false,
    showBrand: true,
    flavorLines: 3,
  },
} as const;

function HoloBands({ bands, muted = false }: { bands: RarityFinish['holoBands']; muted?: boolean }) {
  if (bands.length === 0) return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {bands.map((colors, i) => (
        <LinearGradient
          key={i}
          colors={colors}
          start={{ x: 0, y: i * 0.3 }}
          end={{ x: 1, y: 0.7 + i * 0.2 }}
          style={[StyleSheet.absoluteFillObject, { opacity: (muted ? 0.48 : 0.68) + i * (muted ? 0.06 : 0.1) }]}
        />
      ))}
    </View>
  );
}

function LameFlakes({
  seed,
  accent,
  rarity,
  muted = false,
}: {
  seed: number;
  accent: string;
  rarity: CardRarity;
  muted?: boolean;
}) {
  const count =
    rarity === 'SECRET' ? (muted ? 24 : 52)
    : rarity === 'UR' ? (muted ? 22 : 46)
    : rarity === 'SR' ? (muted ? 20 : 40)
    : rarity === 'R' ? (muted ? 18 : 34)
    : 0;
  if (count === 0) return null;

  const flakes = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const u1 = (seed * 73 + i * 131) % 1000;
        const u2 = (seed * 197 + i * 89) % 1000;
        const u3 = (seed * 311 + i * 53) % 1000;
        const u4 = (seed * 419 + i * 71) % 1000;
        return {
          cx: (u1 % 900) / 10 + 5,
          cy: (u2 % 880) / 10 + 6,
          rx: 0.7 + (u3 % 9) * 0.28,
          ry: 0.14 + (u4 % 6) * 0.07,
          angle: u3 % 360,
          opacity: (muted ? 0.24 : 0.38) + (u4 % 10) * (muted ? 0.03 : 0.045),
          color: i % 5 === 0 ? '#FFFFFF' : i % 3 === 0 ? '#FFF6D8' : accent,
        };
      }),
    [accent, count, muted, seed],
  );

  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {flakes.map((flake, i) => (
        <G key={i} rotation={flake.angle} origin={`${flake.cx}, ${flake.cy}`}>
          <Ellipse
            cx={flake.cx}
            cy={flake.cy}
            rx={flake.rx}
            ry={flake.ry}
            fill={flake.color}
            opacity={flake.opacity}
          />
        </G>
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
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={finish.paper} style={StyleSheet.absoluteFillObject} />
      <PaperGrain dark={finish.dark} />
      <LinearGradient
        colors={finish.dark ? ['rgba(255,255,255,0.04)', 'transparent'] : ['rgba(255,255,255,0.7)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </View>
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
  imageFraming,
  framingEditable = false,
  onImageFramingChange,
  size = 'grid',
  isActive = true,
  style,
  onPress,
}: PigeonCardProps) {
  const { t, locale } = useI18n();
  const finish = FINISH[rarity];
  const layout = LAYOUT[size];
  const label = getRarityLabel(rarity, t);
  const flavor = getRarityFlavor(rarity, flavorIndex, t);
  const powerStars = getCardPowerStars(rarity, scanNo);
  const hp = getCardHp(rarity, scanNo);
  const retreat = getCardRetreatCost(rarity, scanNo);
  const name = formatScanLabel(scanNo, t);
  const serial = `${t.card.serial}${String(scanNo).padStart(3, '0')}`;
  const moveSeed = buildMoveSeed(entryId, scanNo, flavorIndex);
  const [move1, move2] = generateCardMoves({ seed: moveSeed, locale, rarity });
  const dmg1 = getCardAttackDamage(rarity, scanNo, 1);
  const dmg2 = getCardAttackDamage(rarity, scanNo, 2);
  const showSecondMoveDesc =
    layout.showMove2Desc && move2.desc.length > 0 && move2.desc !== move1.desc;
  const hasHolo = finish.holoBands.length > 0;
  const framing = normalizeCardImageFraming(imageFraming);
  const nativeImageUri =
    imageUri.startsWith('file://') || imageUri.startsWith('data:') || imageUri.startsWith('http')
      ? imageUri
      : `file://${imageUri}`;

  const useNativeHolo =
    Platform.OS === 'ios' &&
    isPoppoCardsNativeAvailable() &&
    isPoppoHoloCardViewAvailable() &&
    !framingEditable;
  const nativeActive = size === 'grid' ? false : isActive;
  const gridMuted = size === 'grid';

  if (useNativeHolo) {
    const holoCard = (
      <View style={[styles.shell, style]}>
        <PoppoHoloCardView
          imageUri={nativeImageUri}
          imageScale={framing.scale}
          imageOffsetX={framing.offsetX}
          imageOffsetY={framing.offsetY}
          rarity={toHoloCardRarity(rarity)}
          quality={size === 'grid' ? 'compact' : 'full'}
          isActive={nativeActive}
          cardName={name}
          typeLong={t.card.typeLong}
          profile={t.card.profile}
          rarityLabel={label}
          serial={serial}
          starCount={powerStars}
          hp={String(hp)}
          retreatCost={String(retreat)}
          move1Name={move1.name}
          move1Damage={String(dmg1)}
          move1Cost=""
          move2Name={move2.name}
          move2Damage={String(dmg2)}
          move2Cost=""
          moveDescription={move1.desc}
          move2Description={move2.desc}
          moveTraitLabel={t.card.moveTrait}
          flavor={flavor}
          brandLine={t.card.brandLine}
          hpLabel={t.card.hp}
          retreatLabel={t.card.retreat}
          showMove2={layout.showMove2}
          showMoveDesc={layout.showMoveDesc}
          showMove2Desc={showSecondMoveDesc}
          showMeta={layout.showMeta}
          showProfile={layout.showProfile}
          showStats={layout.showStats}
          showCosts={layout.showCosts}
          showBrand={layout.showBrand}
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
            style={[styles.frameSpecular, gridMuted && styles.frameSpecularGrid]}
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

              {layout.showMeta ? (
                <View style={styles.metaRow}>
                  <Text
                    style={[styles.typeLong, { color: finish.ink, fontSize: layout.meta }]}
                    numberOfLines={1}
                  >
                    {t.card.typeLong}
                  </Text>
                  {layout.showStats ? (
                    <Text style={[styles.hpText, { color: finish.ink, fontSize: layout.meta }]}>
                      {t.card.hp} {hp}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View
                style={[
                  styles.artSection,
                  { flex: layout.artFlex },
                  framingEditable && styles.artSectionEditable,
                ]}
              >
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
                    <CardPhotoFrame
                      uri={imageUri}
                      framing={framing}
                      editable={framingEditable}
                      onFramingChange={onImageFramingChange}
                      accessibilityLabel={name}
                      style={styles.artPhotoClip}
                    >
                      {hasHolo ? <HoloBands bands={finish.holoBands} muted={gridMuted} /> : null}
                      {hasHolo ? (
                        <LameFlakes
                          seed={scanNo + flavorIndex * 17}
                          accent={finish.accentBright}
                          rarity={rarity}
                          muted={gridMuted}
                        />
                      ) : null}
                      <LinearGradient
                        colors={
                          gridMuted
                            ? ['rgba(255,255,255,0.14)', 'transparent', 'rgba(0,0,0,0.1)']
                            : ['rgba(255,255,255,0.2)', 'transparent', 'rgba(0,0,0,0.15)']
                        }
                        locations={[0, 0.4, 1]}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                    </CardPhotoFrame>
                  </View>
                </View>
              </View>

              <View style={styles.nameBanner}>
                <View style={[styles.nameRule, { backgroundColor: finish.accent }]} />
                <View
                  style={[
                    styles.namePlate,
                    {
                      backgroundColor: finish.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.72)',
                    },
                  ]}
                >
                  <View style={[styles.nameTick, { backgroundColor: finish.accent }]} />
                  <Text
                    style={[
                      styles.cardName,
                      {
                        color: finish.ink,
                        fontSize: layout.name + 0.5,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <View style={[styles.nameTick, { backgroundColor: finish.accent }]} />
                </View>
                <View style={[styles.nameRule, { backgroundColor: finish.accent }]} />
              </View>

              {layout.showProfile ? (
                <Text
                  style={[styles.profileLine, { color: finish.muted, fontSize: layout.sub - 1 }]}
                  numberOfLines={1}
                >
                  {t.card.profile}
                </Text>
              ) : null}

              <View
                style={[
                  styles.textBox,
                  {
                    borderTopColor: finish.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.14)',
                    borderLeftColor: finish.dark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.1)',
                    borderBottomColor: finish.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                    borderRightColor: finish.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)',
                    backgroundColor: finish.textBox?.[0] ?? 'rgba(255,255,255,0.82)',
                  },
                ]}
              >
                <View style={styles.moveBlock}>
                  <View style={styles.attackRow}>
                    <Text style={[styles.moveLine, { color: finish.ink, fontSize: layout.sub, flex: 1 }]} numberOfLines={1}>
                      <Text style={{ color: finish.ink, fontWeight: '900' }}>{move1.name}</Text>
                    </Text>
                    <Text style={[styles.damage, { color: finish.ink, fontSize: layout.sub }]}>{dmg1}</Text>
                  </View>
                  {layout.showMoveDesc && move1.desc ? (
                    <Text style={[styles.moveTrait, { fontSize: layout.sub - 1 }]} numberOfLines={2}>
                      <Text style={{ color: finish.accent, fontWeight: '700' }}>{t.card.moveTrait} </Text>
                      <Text style={{ color: finish.muted }}>{move1.desc}</Text>
                    </Text>
                  ) : null}
                </View>
                {layout.showMove2 ? (
                  <View style={styles.moveBlock}>
                    <View style={styles.attackRow}>
                      <Text style={[styles.moveLine, { color: finish.ink, fontSize: layout.sub, flex: 1 }]} numberOfLines={1}>
                        <Text style={{ color: finish.ink, fontWeight: '900' }}>{move2.name}</Text>
                      </Text>
                      <Text style={[styles.damage, { color: finish.ink, fontSize: layout.sub }]}>
                        {dmg2}
                      </Text>
                    </View>
                    {showSecondMoveDesc ? (
                      <Text style={[styles.moveTrait, { fontSize: layout.sub - 1 }]} numberOfLines={2}>
                        <Text style={{ color: finish.accent, fontWeight: '700' }}>{t.card.moveTrait} </Text>
                        <Text style={{ color: finish.muted }}>{move2.desc}</Text>
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <View style={[styles.ruleLine, { backgroundColor: finish.accentSoftBg }]} />
                <Text
                  style={[styles.flavor, { color: finish.muted, fontSize: layout.sub - 1 }]}
                  numberOfLines={layout.flavorLines}
                >
                  {flavor}
                </Text>
                {layout.showBrand ? (
                  <View style={styles.brandRow}>
                    <Text style={[styles.brandLine, { color: finish.muted, fontSize: layout.sub - 2 }]}>
                      {t.card.brandLine}
                    </Text>
                    {layout.showStats ? (
                      <Text style={[styles.retreatText, { color: finish.muted, fontSize: layout.sub - 2 }]}>
                        {t.card.retreat} {retreat}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {hasHolo && !framingEditable && !gridMuted ? (
                <LinearGradient
                  colors={['rgba(255,255,255,0.22)', 'transparent', 'rgba(255,255,255,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.foilWash}
                  pointerEvents="none"
                />
              ) : null}

              {hasHolo && !framingEditable && !gridMuted ? (
                <LameFlakes seed={scanNo * 3 + flavorIndex} accent={finish.accentBright} rarity={rarity} />
              ) : null}

              <LinearGradient
                colors={
                  gridMuted
                    ? ['rgba(255,255,255,0.16)', 'transparent', 'transparent']
                    : ['rgba(255,255,255,0.28)', 'transparent', 'transparent']
                }
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
  frameSpecularGrid: {
    opacity: 0.24,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    zIndex: 2,
  },
  typeLong: {
    fontWeight: '800',
    letterSpacing: 0.6,
    flex: 1,
  },
  hpText: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  artSection: {
    minHeight: 0,
  },
  artSectionEditable: {
    zIndex: 10,
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
  artPhotoClip: {
    flex: 1,
    borderRadius: 4,
  },
  nameBanner: {
    gap: 2,
    zIndex: 2,
  },
  nameRule: {
    alignSelf: 'center',
    width: '88%',
    height: StyleSheet.hairlineWidth * 2,
    opacity: 0.34,
  },
  namePlate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: 'rgba(0,0,0,0.08)',
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  nameTick: {
    width: 2,
    height: 8,
    opacity: 0.42,
    borderRadius: 1,
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
    flex: 1,
    fontFamily: CARD_NAME_FONT_FAMILY,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.55)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0,
  },
  profileLine: {
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
    zIndex: 2,
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
    gap: 4,
  },
  moveCost: {
    fontWeight: '900',
    minWidth: 14,
    textAlign: 'center',
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
  moveBlock: {
    gap: 2,
    marginBottom: 4,
  },
  moveTrait: {
    lineHeight: 11,
    fontStyle: 'italic',
  },
  flavor: {
    lineHeight: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  brandLine: {
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  retreatText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  foilWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.72,
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
