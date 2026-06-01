import type { ImageSourcePropType } from 'react-native';

export type OnboardingScene = 'scan' | 'ai' | 'collection' | 'welcome';

export const onboardingIllustrations: Record<OnboardingScene, ImageSourcePropType> = {
  scan: require('../../assets/onboarding/onboarding-scan.png'),
  ai: require('../../assets/onboarding/onboarding-ai.png'),
  collection: require('../../assets/onboarding/onboarding-collection.png'),
  welcome: require('../../assets/onboarding/onboarding-welcome.png'),
};
