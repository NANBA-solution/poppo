import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { buildShareCaption } from '@/utils/sharePigeon';
import { isExpoGo } from '@/utils/runtime';

function getFacebookAppId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID;
  const fromEnv = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  const value =
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    '';
  return value || undefined;
}

function normalizeFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
}

export async function captureShareImage(ref: View): Promise<string> {
  return captureRef(ref, {
    format: 'jpg',
    quality: 0.92,
    result: 'tmpfile',
  });
}

async function copyCaption(breed: string): Promise<void> {
  await Clipboard.setStringAsync(buildShareCaption(breed));
}

async function openShareSheet(fileUri: string, dialogTitle: string): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return false;
  try {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'image/jpeg',
      dialogTitle,
      UTI: 'public.jpeg',
    });
    return true;
  } catch {
    return false;
  }
}

async function isInstagramInstalled(): Promise<boolean> {
  try {
    return await Linking.canOpenURL('instagram://app');
  } catch {
    return false;
  }
}

/** 開発ビルド / 本番のみ: react-native-share で Instagram ストーリー直起動 */
async function shareInstagramStoryNative(image: string): Promise<boolean> {
  if (isExpoGo()) return false;

  const appId = getFacebookAppId();
  if (Platform.OS === 'ios' && !appId) {
    return false;
  }

  try {
    const { default: RNShare, Social } = await import('react-native-share');
    await RNShare.shareSingle({
      social: Social.InstagramStories,
      backgroundImage: image,
      backgroundBottomColor: '#0a0a0f',
      backgroundTopColor: '#0a0a0f',
      ...(appId ? { appId } : {}),
    } as Parameters<typeof RNShare.shareSingle>[0]);
    return true;
  } catch {
    return false;
  }
}

/** 共有シート（Instagram を選べる） */
async function shareViaNativeOpenSheet(image: string): Promise<boolean> {
  if (isExpoGo()) return false;
  try {
    const { default: RNShare } = await import('react-native-share');
    await RNShare.open({
      url: image,
      type: 'image/jpeg',
      failOnCancel: false,
    });
    return true;
  } catch {
    return false;
  }
}

/** 開発ビルド / 本番のみ: X アプリへ画像付き共有 */
async function shareXNative(image: string, caption: string): Promise<boolean> {
  if (isExpoGo()) return false;
  try {
    const { default: RNShare, Social } = await import('react-native-share');
    await RNShare.shareSingle({
      social: Social.Twitter,
      message: caption,
      url: image,
    });
    return true;
  } catch {
    return false;
  }
}

/** Instagram ストーリーへ共有 */
export async function shareToInstagramStory(fileUri: string, breed: string): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Web では Instagram ストーリー共有に対応していません。');
  }

  const image = normalizeFileUri(fileUri);
  await copyCaption(breed);

  const hasInstagram = await isInstagramInstalled();
  if (!hasInstagram) {
    throw new Error(
      'Instagram アプリが見つかりません。App Store からインストールしてください。',
    );
  }

  const appId = getFacebookAppId();

  // Meta App ID あり → ストーリー編集画面を直接開く（要: .env + 再ビルド）
  if (appId && (await shareInstagramStoryNative(image))) {
    return;
  }

  // iOS で App ID が無い場合は、画像保存→Instagram 起動に寄せる（確実に開く）
  if (Platform.OS === 'ios' && !appId) {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('写真ライブラリへのアクセスが必要です。');
    }
    await MediaLibrary.saveToLibraryAsync(fileUri);
    await Linking.openURL('instagram://app');
    Alert.alert(
      'Instagram を開きました',
      'ストーリー作成で保存した画像を選んで投稿してください。',
    );
    return;
  }

  // Android: Instagram Intent
  if (Platform.OS === 'android') {
    try {
      const contentUri = await getContentUriAsync(image);
      await IntentLauncher.startActivityAsync('com.instagram.share.ADD_TO_STORY', {
        data: contentUri,
        type: 'image/jpeg',
        flags: 1,
      });
      return;
    } catch {
      // フォールバックへ
    }
  }

  // 共有シートで Instagram を選択
  if (await shareViaNativeOpenSheet(image)) {
    return;
  }

  if (await openShareSheet(fileUri, 'Instagram ストーリーへ')) {
    return;
  }

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('写真ライブラリへのアクセスが必要です。');
  }
  await MediaLibrary.saveToLibraryAsync(fileUri);
  await Linking.openURL('instagram://app');
  Alert.alert(
    'Instagram を開きました',
    'ストーリー作成で保存した画像を選んで投稿してください。',
  );
}

/** X（Twitter）へ投稿 */
export async function shareToX(fileUri: string, breed: string): Promise<void> {
  if (Platform.OS === 'web') {
    const text = encodeURIComponent(buildShareCaption(breed));
    await Linking.openURL(`https://x.com/intent/tweet?text=${text}`);
    return;
  }

  const caption = buildShareCaption(breed);
  const image = normalizeFileUri(fileUri);
  await copyCaption(breed);

  // 本番ビルド: X アプリ直共有
  if (await shareXNative(image, caption)) {
    return;
  }

  if (await openShareSheet(fileUri, 'X にポスト')) {
    return;
  }

  const encoded = encodeURIComponent(caption);
  const appUrls = [`twitter://post?message=${encoded}`, `x://post?message=${encoded}`];
  for (const url of appUrls) {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      Alert.alert(
        'X を開きました',
        '画像は写真アプリから X に追加してください。',
      );
      return;
    }
  }

  await Linking.openURL(`https://x.com/intent/tweet?text=${encoded}`);
  Alert.alert('X を開きました');
}
