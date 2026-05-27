import Constants from 'expo-constants';

/** Expo Go で動いているか（ネイティブモジュール未同梱） */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** スタンドアlon / 開発ビルド（react-native-share 利用可） */
export function isNativeBuild(): boolean {
  return !isExpoGo();
}
