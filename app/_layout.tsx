import 'react-native-gesture-handler';

import { I18nProvider } from '@/i18n/I18nProvider';
import { ensureSupabaseSession } from '@/services/authService';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { colors } from '@/theme/tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootNavigator() {
  const [booting, setBooting] = React.useState(true);

  React.useEffect(() => {
    setBooting(false);
  }, []);

  React.useEffect(() => {
    if (booting) return;
    if (!isSupabaseConfigured()) return;
    void ensureSupabaseSession().catch(() => undefined);
  }, [booting]);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
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
          <StatusBar style="light" />
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
  },
});
