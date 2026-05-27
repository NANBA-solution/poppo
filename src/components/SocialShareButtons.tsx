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
          'シェアエラー',
          e instanceof Error ? e.message : '共有に失敗しました。',
        );
      } finally {
        setBusy(null);
      }
    },
    [breed, busy, disabled, nickname, shareRef],
  );

  const isDisabled = disabled || busy !== null;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Instagram ストーリーに投稿"
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
            <Text style={styles.btnEmoji}>📸</Text>
            <Text style={styles.btnLabel}>Instagram{'\n'}ストーリー</Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="X にポスト"
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
            <Text style={styles.btnEmoji}>𝕏</Text>
            <Text style={styles.btnLabel}>X にポスト</Text>
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  instagramBtn: {
    backgroundColor: '#E1306C',
  },
  xBtn: {
    backgroundColor: '#111',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnEmoji: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
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
