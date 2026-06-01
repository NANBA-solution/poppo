import { OnboardingHero } from '@/components/onboarding/OnboardingHero';
import {
  OnboardingGhostButton,
  OnboardingPrimaryButton,
} from '@/components/onboarding/OnboardingChrome';
import { Screen } from '@/components/ui/Screen';
import { useI18n } from '@/i18n/I18nProvider';
import {
  canUseAppleSignIn,
  ensureSupabaseSession,
  signInWithAppleAndMigrate,
} from '@/services/authService';
import { completeAuthWelcome } from '@/services/authWelcomeService';
import { colors, radii, shadow } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [appleLoading, setAppleLoading] = React.useState(false);
  const [continuing, setContinuing] = React.useState(false);

  const finish = React.useCallback(async () => {
    await completeAuthWelcome();
    router.replace('/camera');
  }, [router]);

  const onContinue = React.useCallback(async () => {
    void hapticLight();
    try {
      setContinuing(true);
      if (isSupabaseConfigured()) {
        await ensureSupabaseSession();
      }
      await finish();
    } finally {
      setContinuing(false);
    }
  }, [finish]);

  const onApple = React.useCallback(async () => {
    void hapticLight();
    try {
      setAppleLoading(true);
      await signInWithAppleAndMigrate();
      await finish();
    } catch (e) {
      const message = e instanceof Error ? e.message : t.common.error;
      Alert.alert(t.settings.appleFailed, message);
    } finally {
      setAppleLoading(false);
    }
  }, [finish, t]);

  const showApple = canUseAppleSignIn();
  const busy = appleLoading || continuing;

  return (
    <Screen edges={false}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.eyebrow}>{t.auth.eyebrow}</Text>

        <View style={styles.heroWrap}>
          <OnboardingHero scene="welcome" accentColor={colors.accent} />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{t.auth.title}</Text>
          <Text style={styles.body}>{t.auth.body}</Text>
        </View>

        <View style={styles.actions}>
          <OnboardingPrimaryButton
            label={continuing ? t.common.loading : t.auth.continue}
            onPress={onContinue}
          />

          {showApple ? (
            <Pressable
              disabled={busy}
              onPress={onApple}
              style={({ pressed }) => [
                styles.appleBtn,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              {appleLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.appleGlyph,
                      Platform.OS === 'ios' ? styles.appleGlyphIos : null,
                    ]}
                    accessibilityLabel="Apple"
                  >
                    {'\uF8FF'}
                  </Text>
                  <View style={styles.appleTextCol}>
                    <Text style={styles.appleLabel}>{t.auth.apple}</Text>
                    <Text style={styles.appleHint}>{t.auth.appleHint}</Text>
                  </View>
                </>
              )}
            </Pressable>
          ) : null}

          <Text style={styles.footnote}>{t.auth.footnote}</Text>
        </View>

        <OnboardingGhostButton
          label={t.common.back}
          onPress={() => router.replace('/onboarding')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  copyBlock: {
    gap: 12,
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    backgroundColor: colors.text,
    ...shadow.card,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  appleTextCol: {
    flex: 1,
    gap: 2,
  },
  appleLabel: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  appleHint: {
    color: 'rgba(9,9,11,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  appleGlyph: {
    color: colors.bg,
    fontSize: 20,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  appleGlyphIos: {
    fontFamily: 'System',
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  disabled: { opacity: 0.55 },
});
