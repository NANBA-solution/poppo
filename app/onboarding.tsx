import {
  OnboardingGhostButton,
  OnboardingPrimaryButton,
  OnboardingProgress,
} from '@/components/onboarding/OnboardingChrome';
import { OnboardingHero } from '@/components/onboarding/OnboardingHero';
import { LanguagePills } from '@/components/ui/LanguagePills';
import { Screen } from '@/components/ui/Screen';
import { useI18n } from '@/i18n/I18nProvider';
import { completeOnboarding } from '@/services/onboardingService';
import { colors } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import type { OnboardingScene } from '@/constants/onboardingIllustrations';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StepDef = {
  scene: OnboardingScene;
  tag: string;
  title: string;
  body: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [step, setStep] = React.useState(0);

  const steps = React.useMemo<StepDef[]>(
    () => [
      {
        scene: 'scan',
        tag: t.onboarding.step1Tag,
        title: t.onboarding.step1Title,
        body: t.onboarding.step1Body,
      },
      {
        scene: 'ai',
        tag: t.onboarding.step2Tag,
        title: t.onboarding.step2Title,
        body: t.onboarding.step2Body,
      },
      {
        scene: 'collection',
        tag: t.onboarding.step3Tag,
        title: t.onboarding.step3Title,
        body: t.onboarding.step3Body,
      },
    ],
    [t],
  );

  const goCamera = React.useCallback(async () => {
    await completeOnboarding();
    router.replace('/camera');
  }, [router]);

  const onNext = React.useCallback(async () => {
    void hapticLight();
    if (step >= steps.length - 1) {
      await goCamera();
      return;
    }
    setStep((s) => s + 1);
  }, [goCamera, step, steps.length]);

  const current = steps[step];

  return (
    <Screen edges={false}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/brand-icon.png')} style={styles.brandIcon} />
            <View style={styles.brandCopy}>
              <Text style={styles.brand}>POPPO</Text>
              <Text style={styles.brandJa}>{t.onboarding.appName}</Text>
              <Text style={styles.tagline}>{t.onboarding.tagline}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <LanguagePills compact />
            <OnboardingGhostButton label={t.common.skip} onPress={goCamera} />
          </View>
        </View>

        <View key={current.scene} style={styles.heroWrap}>
          <OnboardingHero scene={current.scene} />
        </View>

        <View key={`copy-${step}`} style={styles.copyBlock}>
          <Text style={styles.stepTag}>{current.tag}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>

        <View style={styles.footer}>
          <OnboardingProgress total={steps.length} index={step} />
          <OnboardingPrimaryButton
            label={step >= steps.length - 1 ? t.common.start : t.common.next}
            onPress={onNext}
          />
        </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandJa: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    paddingVertical: 8,
  },
  copyBlock: {
    gap: 10,
    paddingHorizontal: 4,
  },
  stepTag: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: 340,
  },
  footer: {
    gap: 16,
    paddingTop: 8,
  },
});
