import type { ImageSourcePropType } from 'react-native';

export type OnboardingScene = 'scan' | 'ai' | 'collection' | 'welcome';

export const onboardingIllustrations: Record<OnboardingScene, ImageSourcePropType> = {
  scan: require('../../assets/onboarding/onboarding-v3-scan.png'),
  ai: require('../../assets/onboarding/onboarding-v3-detect.png'),
  collection: require('../../assets/onboarding/onboarding-v3-collection.png'),
  welcome: require('../../assets/onboarding/onboarding-v3-scan.png'),
};
