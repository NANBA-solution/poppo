const { withPodfile } = require('expo/config-plugins');

const MARKER = 'Xcode 26 workaround';

const RUBY_PATCH = `
    # ${MARKER}: fmt 11.x + Apple Clang 21 (Xcode 26.4) consteval ビルドエラー回避
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('${MARKER}')
        patched = content.gsub(
          /(#elif defined\\(__cpp_consteval\\)\\n#  define FMT_USE_CONSTEVAL) 1/,
          '\\\\1 0 // ${MARKER}'
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
        end
      end
    end
`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withXcode26FmtFix(config) {
  return withPodfile(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      /(post_install do \|installer\|[\s\S]*?react_native_post_install\([\s\S]*?\)\n)(  end)/,
      `$1${RUBY_PATCH}$2`,
    );

    return config;
  });
}

module.exports = withXcode26FmtFix;
