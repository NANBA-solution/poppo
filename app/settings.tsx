import { AppIcon } from '@/components/icons/AppIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { clearAllCollection } from '@/services/collectionService';
import {
  canUseAppleSignIn,
  getAuthProviderType,
  signInWithAppleAndMigrate,
  type AuthProviderType,
} from '@/services/authService';
import type { AppLocale } from '@/services/localeService';
import { resetOnboardingFlow } from '@/services/onboardingService';
import { colors, radii } from '@/theme/tokens';
import { hapticWarning } from '@/utils/haptics';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [clearing, setClearing] = React.useState(false);
  const [appleSigningIn, setAppleSigningIn] = React.useState(false);
  const [authProvider, setAuthProvider] = React.useState<AuthProviderType>('signed_out');

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

  const handleAppleSignIn = React.useCallback(async () => {
    try {
      setAppleSigningIn(true);
      await signInWithAppleAndMigrate();
      setAuthProvider('apple');
      Alert.alert(t.settings.appleDone, t.settings.appleDoneBody);
    } catch (e) {
      Alert.alert(
        t.settings.appleFailed,
        e instanceof Error ? e.message : t.common.error,
      );
    } finally {
      setAppleSigningIn(false);
    }
  }, [t]);

  useFocusEffect(
    React.useCallback(() => {
      void getAuthProviderType().then(setAuthProvider);
    }, []),
  );

  const authStatusLabel = React.useMemo(() => {
    if (authProvider === 'apple') return t.settings.appleLinked;
    if (authProvider === 'anonymous') return t.settings.anonymous;
    if (authProvider === 'other') return t.settings.appleLinked;
    return t.settings.signedOut;
  }, [authProvider, t]);

  const setLanguage = React.useCallback(
    (next: AppLocale) => {
      void setLocale(next);
    },
    [setLocale],
  );

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
          <SettingsRow label={t.settings.accountStatus} value={authStatusLabel} />
          <View style={styles.divider} />
          <View style={styles.langRow}>
            <Text style={styles.rowLabel}>{t.settings.language}</Text>
            <View style={styles.langPills}>
              <Pressable
                onPress={() => setLanguage('ja')}
                style={({ pressed }) => [
                  styles.langPill,
                  locale === 'ja' && styles.langPillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.langPillLabel, locale === 'ja' && styles.langPillLabelActive]}>
                  {t.settings.languageJa}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage('en')}
                style={({ pressed }) => [
                  styles.langPill,
                  locale === 'en' && styles.langPillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.langPillLabel, locale === 'en' && styles.langPillLabelActive]}>
                  {t.settings.languageEn}
                </Text>
              </Pressable>
            </View>
          </View>
          {canUseAppleSignIn() && (
            <>
              <View style={styles.divider} />
              <SettingsRow
                label={t.settings.appleSignIn}
                value={appleSigningIn ? '…' : undefined}
                onPress={handleAppleSignIn}
                disabled={appleSigningIn}
              />
            </>
          )}
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
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
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
  langPills: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  langPillActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentSoft,
  },
  langPillLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  langPillLabelActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.45 },
});
