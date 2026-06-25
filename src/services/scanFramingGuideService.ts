import AsyncStorage from '@react-native-async-storage/async-storage';

const SCAN_FRAMING_GUIDE_KEY = '@poppo/scan-framing-guide/v1';

export async function shouldShowScanFramingGuide(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(SCAN_FRAMING_GUIDE_KEY);
  return seen !== '1';
}

export async function completeScanFramingGuide(): Promise<void> {
  await AsyncStorage.setItem(SCAN_FRAMING_GUIDE_KEY, '1');
}
