import { AppIcon } from '@/components/icons/AppIcon';
import { getLocalizedStamps } from '@/constants/feedStamps';
import { useI18n } from '@/i18n/I18nProvider';
import type { StampId } from '@/types/feed';
import { hapticLight } from '@/utils/haptics';
import { colors, radii } from '@/theme/tokens';
import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type PoppoStampBarProps = {
  onStamp: (stampId: StampId) => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  title?: string;
};

export function PoppoStampBar({
  onStamp,
  disabled = false,
  busy = false,
  title,
}: PoppoStampBarProps) {
  const { t } = useI18n();
  const stamps = React.useMemo(() => getLocalizedStamps(t.feed.stamps), [t.feed.stamps]);

  return (
    <View style={styles.wrap}>
      {title ? (
        <View style={styles.titleRow}>
          <AppIcon name="sound" size={14} color={colors.textMuted} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {stamps.map((stamp) => (
          <Pressable
            key={stamp.id}
            accessibilityRole="button"
            accessibilityLabel={stamp.label}
            disabled={disabled || busy}
            onPress={() => {
              void hapticLight();
              void onStamp(stamp.id);
            }}
            style={({ pressed }) => [
              styles.btn,
              pressed && styles.pressed,
              (disabled || busy) && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnLabel}>{stamp.label}</Text>
          </Pressable>
        ))}
      </View>
      {busy && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.35)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  spinner: { marginTop: 4 },
});
