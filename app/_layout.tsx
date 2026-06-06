import 'react-native-gesture-handler';

import { DailyNotificationBootstrap } from '@/components/DailyNotificationBootstrap';
import { I18nProvider } from '@/i18n/I18nProvider';
import { colors } from '@/theme/tokens';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    setBooting(false);
    void SplashScreen.hideAsync();
  }, []);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.bootText}>起動中…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <DailyNotificationBootstrap />
          <RootNavigator />
        </SafeAreaProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
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
