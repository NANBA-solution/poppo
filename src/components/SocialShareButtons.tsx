import { AppIcon } from '@/components/icons/AppIcon';
import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors, radii } from '@/theme/tokens';
import { captureShareImage, shareToInstagramStory, shareToX } from '@/utils/shareSocial';
import { hapticLight } from '@/utils/haptics';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from 'react-native';

type SocialShareLayout = 'icons' | 'tiles';

type SocialShareButtonsProps = {
  shareRef: React.RefObject<ViewType | null>;
  scanNo: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  layout?: SocialShareLayout;
};

export function SocialShareButtons({
  shareRef,
  scanNo,
  disabled = false,
  onBusyChange,
  layout = 'icons',
}: SocialShareButtonsProps) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = React.useState<'instagram' | 'x' | null>(null);

  React.useEffect(() => {
    onBusyChange?.(busy !== null);
  }, [busy, onBusyChange]);

  const runShare = React.useCallback(
    async (target: 'instagram' | 'x') => {
      if (disabled || busy || !shareRef.current) return;
      try {
        setBusy(target);
        void hapticLight();
        const fileUri = await captureShareImage(shareRef.current);
        if (target === 'instagram') {
          await shareToInstagramStory(fileUri, scanNo, locale);
        } else {
          await shareToX(fileUri, scanNo, locale);
        }
      } catch (e) {
        Alert.alert(
          t.common.shareError,
          e instanceof Error ? e.message : t.share.shareFailed,
        );
      } finally {
        setBusy(null);
      }
    },
    [scanNo, busy, disabled, locale, shareRef, t.common.shareError, t.share.shareFailed],
  );

  const isDisabled = disabled || busy !== null;

  if (layout === 'tiles') {
    return (
      <View style={styles.tileRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.share.instagram}
          disabled={isDisabled}
          onPress={() => runShare('instagram')}
          style={({ pressed }) => [
            styles.tileBtn,
            styles.instagramTile,
            pressed && styles.pressed,
            isDisabled && styles.disabled,
          ]}
        >
          {busy === 'instagram' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AppIcon name="instagram" size={22} color="#fff" />
              <Text style={styles.tileLabel}>{t.share.instagram}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.share.xA11y}
          disabled={isDisabled}
          onPress={() => runShare('x')}
          style={({ pressed }) => [
            styles.tileBtn,
            styles.xTile,
            pressed && styles.pressed,
            isDisabled && styles.disabled,
          ]}
        >
          {busy === 'x' ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <AppIcon name="x-logo" size={20} color={colors.ink} />
              <Text style={[styles.tileLabel, styles.xTileLabel]}>{t.share.xPost}</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.iconRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.share.instagram}
        disabled={isDisabled}
        onPress={() => runShare('instagram')}
        style={({ pressed }) => [
          styles.iconChip,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'instagram' ? (
          <ActivityIndicator color={colors.ink} size="small" />
        ) : (
          <>
            <View style={[styles.iconCircle, styles.instagramCircle]}>
              <AppIcon name="instagram" size={18} color="#fff" />
            </View>
            <Text style={styles.iconChipLabel}>{t.share.instagramShort}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.share.xA11y}
        disabled={isDisabled}
        onPress={() => runShare('x')}
        style={({ pressed }) => [
          styles.iconChip,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'x' ? (
          <ActivityIndicator color={colors.ink} size="small" />
        ) : (
          <>
            <View style={[styles.iconCircle, styles.xCircle]}>
              <AppIcon name="x-logo" size={16} color={colors.ink} />
            </View>
            <Text style={styles.iconChipLabel}>{t.share.xPost}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  iconChip: {
    minWidth: 108,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramCircle: {
    backgroundColor: '#D63378',
  },
  xCircle: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.borderStrong,
  },
  iconChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tileBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: radii.md,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  instagramTile: {
    backgroundColor: '#E1306C',
  },
  xTile: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.medium,
    borderColor: colors.borderStrong,
  },
  tileLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  xTileLabel: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
