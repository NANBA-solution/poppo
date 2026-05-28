import { POPPO_STAMPS } from '@/services/feedService';
import type { StampId } from '@/types/feed';
import { hapticLight } from '@/utils/haptics';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
  title = 'ぽっぽ語を送る',
}: PoppoStampBarProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {POPPO_STAMPS.map((stamp) => (
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
      {busy && <ActivityIndicator color="#c9d6ee" style={styles.spinner} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: {
    color: 'rgba(201,214,238,0.65)',
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
    borderRadius: 999,
    backgroundColor: 'rgba(255,217,138,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,217,138,0.4)',
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { color: '#ffd98a', fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.88 },
  spinner: { marginTop: 4 },
});
