import { completeOnboarding } from '@/services/onboardingService';
import { hapticLight } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = [
  {
    emoji: '📸',
    title: 'ハトを撮る',
    body: '街中で見つけたハトをカメラでスキャン。ピンチでズーム、タップでフォーカスもできます。',
  },
  {
    emoji: '🧠',
    title: 'AI がガチ判定',
    body: 'AI が品種を判定し、ネットミーム風のシュールな二つ名を生成します。',
  },
  {
    emoji: '🕊️',
    title: 'コレクションに追加',
    body: 'スキャンしたハトはマイぽっぽに保存。シェアして友達にも自慢しよう。',
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = React.useState(0);

  const finish = React.useCallback(async () => {
    await completeOnboarding();
    router.replace('/');
  }, [router]);

  const onNext = React.useCallback(async () => {
    void hapticLight();
    if (step >= STEPS.length - 1) {
      await finish();
      return;
    }
    setStep((s) => s + 1);
  }, [finish, step]);

  const current = STEPS[step];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="スキップ"
        onPress={finish}
        style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
      >
        <Text style={styles.skipLabel}>スキップ</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.appName}>ぽっぽ POPPO</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </View>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={step >= STEPS.length - 1 ? 'はじめる' : '次へ'}
        onPress={onNext}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.primaryBtnLabel}>
          {step >= STEPS.length - 1 ? 'はじめる' : '次へ'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 28,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipLabel: {
    color: 'rgba(201,214,238,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  appName: {
    color: 'rgba(201,214,238,0.65)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  title: {
    color: '#F4F7FA',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: 'rgba(244,247,250,0.72)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#7CB8FF',
    width: 22,
  },
  primaryBtn: {
    backgroundColor: '#7CB8FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnLabel: {
    color: '#0a2540',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
