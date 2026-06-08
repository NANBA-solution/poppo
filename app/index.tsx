import { LaunchScreen } from '@/components/ui/LaunchScreen';
import { useI18n } from '@/i18n/I18nProvider';
import { shouldShowOnboarding } from '@/services/onboardingService';
import { Redirect } from 'expo-router';
import * as React from 'react';

type GateHref = '/onboarding' | '/camera';

/** 起動ゲート: オンボーディング → カメラ */
export default function IndexGate() {
  const { t } = useI18n();
  const [href, setHref] = React.useState<GateHref | null>(null);

  React.useEffect(() => {
    void (async () => {
      const showOnboarding = await shouldShowOnboarding();
      setHref(showOnboarding ? '/onboarding' : '/camera');
    })();
  }, []);

  if (!href) {
    return <LaunchScreen status={t.common.loading} />;
  }

  return <Redirect href={href} />;
}
