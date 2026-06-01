import { AppIcon } from '@/components/icons/AppIcon';
import { useI18n } from '@/i18n/I18nProvider';
import { colors, radii } from '@/theme/tokens';
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
  breed: string;
  nickname: string;
  disabled?: boolean;
};

export function SocialShareButtons({
  shareRef,
  breed,
  nickname,
  disabled = false,
}: SocialShareButtonsProps) {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState<'instagram' | 'x' | null>(null);

  const runShare = React.useCallback(
    async (target: 'instagram' | 'x') => {
      if (disabled || busy || !shareRef.current) return;
      try {
        setBusy(target);
        void hapticLight();
        const fileUri = await captureShareImage(shareRef.current);
        if (target === 'instagram') {
          await shareToInstagramStory(fileUri, breed, nickname);
        } else {
          await shareToX(fileUri, breed, nickname);
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
    [breed, busy, disabled, nickname, shareRef, t.common.shareError, t.share.shareFailed],
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
          styles.instagramBtn,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'instagram' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppIcon name="instagram" size={22} color="#fff" />
            <Text style={styles.btnLabel}>{t.share.instagram}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.share.x}
        disabled={isDisabled}
        onPress={() => runShare('x')}
        style={({ pressed }) => [
          styles.btn,
          styles.xBtn,
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {busy === 'x' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <AppIcon name="x-logo" size={20} color="#fff" />
            <Text style={styles.btnLabel}>{t.share.x}</Text>
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
    minHeight: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },
  instagramBtn: {
    backgroundColor: '#E1306C',
  },
  xBtn: {
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
});
