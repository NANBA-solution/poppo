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

type SocialShareButtonsProps = {
  shareRef: React.RefObject<ViewType | null>;
  scanNo: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  compact?: boolean;
};

export function SocialShareButtons({
  shareRef,
  scanNo,
  disabled = false,
  onBusyChange,
  compact = false,
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

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.share.instagram}
        disabled={isDisabled}
        onPress={() => runShare('instagram')}
        style={({ pressed }) => [
          styles.btn,
          compact ? styles.btnCompact : styles.btnTall,
          styles.instagramBtn,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'instagram' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppIcon name="instagram" size={compact ? 20 : 22} color="#fff" />
            <Text style={[styles.btnLabel, compact && styles.btnLabelCompact]}>
              {t.share.instagram}
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.share.xA11y}
        disabled={isDisabled}
        onPress={() => runShare('x')}
        style={({ pressed }) => [
          styles.btn,
          compact ? styles.btnCompact : styles.btnTall,
          styles.xBtn,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'x' ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <AppIcon name="x-logo" size={compact ? 18 : 20} color={colors.ink} />
            <Text style={[styles.btnLabel, styles.xBtnLabel, compact && styles.btnLabelCompact]}>
              {t.share.xPost}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  btnTall: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: 'column',
    gap: 6,
    borderRadius: radii.md,
  },
  btnCompact: {
    minHeight: 48,
    paddingVertical: 12,
  },
  instagramBtn: {
    backgroundColor: '#E1306C',
  },
  xBtn: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.medium,
    borderColor: colors.borderStrong,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  btnLabelCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  xBtnLabel: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
});
