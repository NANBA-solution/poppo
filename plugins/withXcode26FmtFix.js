const { withPodfile, withXcodeProject } = require('expo/config-plugins');

const MARKER = 'poppo iOS Xcode build fixes';

const RUBY_PATCH = `
    # ${MARKER}
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('Xcode 26 workaround')
        patched = content.gsub(
          /(#elif defined\\(__cpp_consteval\\)\\n#  define FMT_USE_CONSTEVAL) 1/,
          '\\\\1 0 // Xcode 26 workaround'
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end

    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        unless config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'].include?('FOLLY_CFG_NO_COROUTINES=1')
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        end
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] ||= ['$(inherited)']
        unless config.build_settings['OTHER_CPLUSPLUSFLAGS'].include?('-DFOLLY_CFG_NO_COROUTINES=1')
          config.build_settings['OTHER_CPLUSPLUSFLAGS'] << '-DFOLLY_CFG_NO_COROUTINES=1'
        end
      end
    end

    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.user_project.native_targets.each do |target|
        target.build_configurations.each do |config|
          config.build_settings['OTHER_CPLUSPLUSFLAGS'] ||= ['$(inherited)']
          unless config.build_settings['OTHER_CPLUSPLUSFLAGS'].include?('-DFOLLY_CFG_NO_COROUTINES=1')
            config.build_settings['OTHER_CPLUSPLUSFLAGS'] << '-DFOLLY_CFG_NO_COROUTINES=1'
          end
        end
      end
      aggregate_target.user_project.save
    end

    portability = File.join(installer.sandbox.root, 'RCT-Folly', 'folly', 'Portability.h')
    if File.exist?(portability)
      File.chmod(0644, portability)
      text = File.read(portability)
      patched = text.gsub('#define FOLLY_HAS_COROUTINES 1', '#define FOLLY_HAS_COROUTINES 0')
      File.write(portability, patched) if patched != text
    end
`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withXcode26FmtFix(config) {
  config = withPodfile(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      /(post_install do \|installer\|[\s\S]*?react_native_post_install\([\s\S]*?\)\n)(  end)/,
      `$1${RUBY_PATCH}$2`,
    );

    return config;
  });

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
      const item = configurations[key];
      if (typeof item !== 'object' || !item.buildSettings) continue;
      if (!item.buildSettings.REACT_NATIVE_PATH) continue;

      const existing = item.buildSettings.OTHER_CPLUSPLUSFLAGS;
      const follyFlags = ['-DFOLLY_CFG_NO_COROUTINES=1', '-DFOLLY_HAVE_CLOCK_GETTIME=1'];
      if (Array.isArray(existing)) {
        if (!existing.some((flag) => String(flag).includes('FOLLY_CFG_NO_COROUTINES'))) {
          item.buildSettings.OTHER_CPLUSPLUSFLAGS = [...existing, ...follyFlags];
        }
      } else {
        item.buildSettings.OTHER_CPLUSPLUSFLAGS = ['$(OTHER_CFLAGS)', ...follyFlags];
      }
    }

    return config;
  });

  return config;
}

module.exports = withXcode26FmtFix;
