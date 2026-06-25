import 'react-native-gesture-handler';

import { DailyNotificationBootstrap } from '@/components/DailyNotificationBootstrap';
import { LaunchScreen } from '@/components/ui/LaunchScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { CARD_NAME_FONT_FAMILY } from '@/theme/cardFonts';
import { colors } from '@/theme/tokens';
import { ZenMaruGothic_700Bold } from '@expo-google-fonts/zen-maru-gothic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const [booting, setBooting] = React.useState(true);
  const [fontsLoaded, fontError] = useFonts({
    [CARD_NAME_FONT_FAMILY]: ZenMaruGothic_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      setBooting(false);
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (booting || (!fontsLoaded && !fontError)) {
    return <LaunchScreen />;
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

