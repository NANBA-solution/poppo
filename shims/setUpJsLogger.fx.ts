/**
 * 古い開発ビルドに ExpoModulesCoreJSLogger.addListener が無い場合の回避。
 * CodedError は公開 export に依存せず、同等の最小実装を登録する。
 */
class CodedError extends Error {
  code: string;
  info?: unknown;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'CodedError';
  }
}

declare namespace globalThis {
  let ExpoModulesCore_CodedError: undefined | typeof CodedError;
}

globalThis.ExpoModulesCore_CodedError = CodedError;
