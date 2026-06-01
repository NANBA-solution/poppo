import { hasCompletedAuthWelcome } from '@/services/authWelcomeService';
import { hasCompletedOnboarding } from '@/services/onboardingService';
import { colors } from '@/theme/tokens';
import { Redirect } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type GateHref = '/onboarding' | '/auth' | '/camera';

/**
 * 起動ゲート: オンボーディング → ログイン/引き継ぎ → カメラ
 */
export default function IndexGate() {
  const [href, setHref] = React.useState<GateHref | null>(null);

  React.useEffect(() => {
    void (async () => {
      const onboarded = await hasCompletedOnboarding();
      if (!onboarded) {
        setHref('/onboarding');
        return;
      }
      const authed = await hasCompletedAuthWelcome();
      setHref(authed ? '/camera' : '/auth');
    })();
  }, []);

  if (!href) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
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
  },
});
