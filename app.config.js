const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY?.trim() ?? '';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
const apiSecret = process.env.EXPO_PUBLIC_POPPO_API_SECRET?.trim() ?? '';
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim() ?? '';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

if (!apiKey && !apiBaseUrl) {
  console.warn(
    '\n⚠️  API 未設定: 開発は EXPO_PUBLIC_ANTHROPIC_API_KEY、本番は EXPO_PUBLIC_API_BASE_URL を .env に設定してください。\n',
  );
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...require('./app.json').expo,
    name: 'ぽっぽ',
    slug: 'poppo',
    ios: {
      ...require('./app.json').expo.ios,
      deploymentTarget: '15.5',
      bundleIdentifier: 'app.poppo.mobile',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          'instagram',
          'instagram-stories',
          'twitter',
          'x',
        ],
        ...(facebookAppId ? { FacebookAppID: facebookAppId } : {}),
      },
    },
    android: {
      ...require('./app.json').expo.android,
      package: 'app.poppo.mobile',
      queries: {
        package: ['com.instagram.android', 'com.twitter.android', 'com.x.android'],
      },
    },
    plugins: [
      ...(require('./app.json').expo.plugins ?? []),
      'expo-dev-client',
      'expo-apple-authentication',
      [
        'expo-media-library',
        {
          photosPermission:
            'ぽっぽ（poppo）がスキャン画像を写真ライブラリに保存し、Instagram 等へ共有します。',
          savePhotosPermission:
            'ぽっぽ（poppo）がスキャン画像を写真ライブラリに保存し、Instagram 等へ共有します。',
        },
      ],
    ],
    extra: {
      EXPO_PUBLIC_ANTHROPIC_API_KEY: apiKey,
      EXPO_PUBLIC_ANTHROPIC_MODEL: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL?.trim() ?? '',
      EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
      EXPO_PUBLIC_POPPO_API_SECRET: apiSecret,
      EXPO_PUBLIC_FACEBOOK_APP_ID: facebookAppId,
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID?.trim() || '1b5fe20e-c747-49e1-9b2f-ffa8f3cdbb7e',
      },
    },
  },
};
