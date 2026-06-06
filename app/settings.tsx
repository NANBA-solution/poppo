import { AppIcon } from '@/components/icons/AppIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { LanguagePills } from '@/components/ui/LanguagePills';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { clearAllCollection } from '@/services/collectionService';
import { resetOnboardingFlow } from '@/services/onboardingService';
import { borders, colors } from '@/theme/tokens';
import { hapticWarning } from '@/utils/haptics';
import Constants from 'expo-constants';
import { useTabRouter } from '@/hooks/useTabRouter';
import * as React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function SettingsRow({
  label,
  value,
  onPress,
  danger,
  disabled,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        danger && styles.rowDanger,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useTabRouter();
  const { t } = useI18n();
  const [clearing, setClearing] = React.useState(false);

  const handleClearCollection = React.useCallback(() => {
    Alert.alert(t.settings.clearConfirmTitle, t.settings.clearConfirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            setClearing(true);
            void hapticWarning();
            const count = await clearAllCollection();
            Alert.alert(t.settings.clearDone, `${count}`);
          } catch (e) {
            Alert.alert(t.common.error, e instanceof Error ? e.message : '');
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  }, [t]);

  const handleShowOnboarding = React.useCallback(() => {
    void resetOnboardingFlow().then(() => router.replace('/onboarding'));
  }, [router]);

  return (
    <Screen>
      <ScreenHeader title={t.settings.title} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.data}</Text>
        <GlassCard>
          <SettingsRow
            label={t.settings.clearCollection}
            onPress={handleClearCollection}
            danger
            disabled={clearing}
          />
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.app}</Text>
        <GlassCard style={styles.cardStack}>
          <View style={styles.langRow}>
            <Text style={styles.rowLabel}>{t.settings.language}</Text>
            <LanguagePills />
          </View>
          <View style={styles.divider} />
          <SettingsRow label={t.settings.onboarding} onPress={handleShowOnboarding} />
          <View style={styles.divider} />
          <SettingsRow label={t.settings.version} value={APP_VERSION} />
        </GlassCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardStack: { paddingVertical: 4, gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  rowDanger: {},
  rowLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  rowLabelDanger: {
    color: colors.danger,
    fontWeight: '700',
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  langRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.45 },
});
