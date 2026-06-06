import { shouldShowOnboarding } from '@/services/onboardingService';
import { colors } from '@/theme/tokens';
import { Redirect } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type GateHref = '/onboarding' | '/camera';

/** 起動ゲート: オンボーディング → カメラ */
export default function IndexGate() {
  const [href, setHref] = React.useState<GateHref | null>(null);

  React.useEffect(() => {
    void (async () => {
      const showOnboarding = await shouldShowOnboarding();
      setHref(showOnboarding ? '/onboarding' : '/camera');
    })();
  }, []);

  if (!href) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.bootText}>ぽっぽを読み込み中…</Text>
      </View>
    );
  }

  return <Redirect href={href} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  bootText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
