/**
 * 古い開発ビルドに ExpoModulesCoreJSLogger.addListener が無い場合の回避。
 * 本番対応: `eas build --profile development` で開発ビルドを作り直す。
 */
import { CodedError } from 'expo-modules-core/src/errors/CodedError';

declare namespace globalThis {
  let ExpoModulesCore_CodedError: undefined | typeof CodedError;
}

globalThis.ExpoModulesCore_CodedError = CodedError;
