import { hasCompletedOnboarding } from '@/services/onboardingService';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    hasCompletedOnboarding().then(() => {
      setBooting(false);
    });
  }, []);

  // 完了直後はメモリ上の state が古いままなので、都度 AsyncStorage を見る
  React.useEffect(() => {
    if (booting) return;

    void hasCompletedOnboarding().then((done) => {
      const onOnboarding = segments[0] === 'onboarding';
      if (!done && !onOnboarding) {
        router.replace('/onboarding');
      }
    });
  }, [booting, router, segments]);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#7CB8FF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
