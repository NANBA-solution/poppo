const fs = require('fs');
const path = require('path');
const { withDangerousMod, withInfoPlist } = require('expo/config-plugins');

const MARKER = 'loadEmbeddedBundleIfAvailable';

const APP_DELEGATE_BODY = `    let delegate = ReactNativeDelegate()`;

const APP_DELEGATE_SUPER = `    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    loadEmbeddedBundleIfAvailable(launchOptions: launchOptions)
    return result
  }

  private func loadEmbeddedBundleIfAvailable(
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) {
    guard let embedded = Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self, let window = self.window else {
        return
      }

      let rootView = self.recreateRootView(
        withBundleURL: embedded,
        moduleName: "main",
        initialProps: nil,
        launchOptions: launchOptions
      )
      let rootViewController = UIViewController()
      rootViewController.view = rootView
      window.rootViewController = rootViewController
      window.makeKeyAndVisible()
    }
  }`;

const SOURCE_URL = `  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bundleURL()
  }`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withXcodeEmbeddedBundle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE = false;
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;

      fs.writeFileSync(
        path.join(iosRoot, '.xcode.env.updates'),
        `# Xcode Run のみで起動（Metro 不要）
# SKIP_BUNDLING=0 だと bash 上 truthy になるため unset する
unset SKIP_BUNDLING
export FORCE_BUNDLING=1
# 同梱バンドルは production モード（__DEV__ だと devtools websocket が必須でクラッシュする）
export EXTRA_PACKAGER_ARGS="--dev false"
`,
      );

      const appDelegatePath = path.join(iosRoot, 'app/AppDelegate.swift');
      let contents = fs.readFileSync(appDelegatePath, 'utf8');

      if (!contents.includes(MARKER)) {
        contents = contents.replace(
          '    let delegate = ReactNativeDelegate()',
          APP_DELEGATE_BODY,
        );

        contents = contents.replace(
          '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
          APP_DELEGATE_SUPER,
        );

        contents = contents.replace(
          /  override func sourceURL\(for bridge: RCTBridge\) -> URL\? \{[\s\S]*?^  \}/m,
          SOURCE_URL,
        );

        fs.writeFileSync(appDelegatePath, contents);
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withXcodeEmbeddedBundle;
