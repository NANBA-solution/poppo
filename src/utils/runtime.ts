import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** iOS/Android シミュレータ（実機ではない） */
export function isSimulator(): boolean {
  if (Constants.isDevice) {
    return false;
  }

  // 一部 dev client で isDevice が誤って false になることがある
  if (Platform.OS === 'ios') {
    const model = Constants.platform?.ios?.model ?? '';
    if (model && !/simulator/i.test(model)) {
      return false;
    }
  }

  if (Platform.OS === 'android') {
    return Constants.platform?.android?.isDevice === false;
  }

  return !Constants.isDevice;
}

/** Expo Go で動いているか（ネイティブモジュール未同梱） */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** スタンドアlon / 開発ビルド（react-native-share 利用可） */
export function isNativeBuild(): boolean {
  return !isExpoGo();
}
