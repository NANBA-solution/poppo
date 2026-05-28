const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const shimPath = path.resolve(__dirname, 'shims/setUpJsLogger.fx.ts');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath ?? '';
  if (
    origin.includes(`${path.sep}expo-modules-core${path.sep}`) &&
    (moduleName === './sweet/setUpJsLogger.fx' || moduleName.endsWith('setUpJsLogger.fx'))
  ) {
    return { filePath: shimPath, type: 'sourceFile' };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
