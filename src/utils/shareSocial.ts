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

async function copyCaption(breed: string, nickname: string): Promise<void> {
  await Clipboard.setStringAsync(buildShareCaption(breed, nickname));
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

/** 開発ビルド / 本番のみ: react-native-share で Instagram ストーリー直起動 */
async function shareInstagramStoryNative(image: string): Promise<boolean> {
  if (isExpoGo()) return false;
  try {
    const { default: RNShare, Social } = await import('react-native-share');
    const appId = getFacebookAppId();
    if (Platform.OS === 'ios') {
      if (!appId) return false;
      await RNShare.shareSingle({
        social: Social.InstagramStories,
        appId,
        backgroundImage: image,
        backgroundBottomColor: '#0a0a0f',
        backgroundTopColor: '#0a0a0f',
      });
    } else {
      await RNShare.shareSingle({
        social: Social.InstagramStories,
        backgroundImage: image,
        backgroundBottomColor: '#0a0a0f',
        backgroundTopColor: '#0a0a0f',
        ...(appId ? { appId } : {}),
      } as Parameters<typeof RNShare.shareSingle>[0]);
    }
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
export async function shareToInstagramStory(
  fileUri: string,
  breed: string,
  nickname: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Web では Instagram ストーリー共有に対応していません。');
  }

  const image = normalizeFileUri(fileUri);
  await copyCaption(breed, nickname);

  // 本番ビルド: ストーリー直起動
  if (await shareInstagramStoryNative(image)) {
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

  // Expo Go / フォールバック: 共有シート
  if (await openShareSheet(fileUri, 'Instagram ストーリーへ')) {
    return;
  }

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('写真ライブラリへのアクセスが必要です。');
  }
  await MediaLibrary.saveToLibraryAsync(fileUri);
  if (await Linking.canOpenURL('instagram://app')) {
    await Linking.openURL('instagram://app');
  }
  Alert.alert(
    '画像を保存しました',
    'キャプションはコピー済みです。Instagram のストーリー作成画面で、保存した画像を選んで投稿してください。',
  );
}

/** X（Twitter）へ投稿 */
export async function shareToX(
  fileUri: string,
  breed: string,
  nickname: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const text = encodeURIComponent(buildShareCaption(breed, nickname));
    await Linking.openURL(`https://x.com/intent/tweet?text=${text}`);
    return;
  }

  const caption = buildShareCaption(breed, nickname);
  const image = normalizeFileUri(fileUri);
  await copyCaption(breed, nickname);

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
        'キャプションはコピー済みです。画像は写真アプリから X に追加してください。',
      );
      return;
    }
  }

  await Linking.openURL(`https://x.com/intent/tweet?text=${encoded}`);
  Alert.alert('X を開きました', 'キャプションはコピー済みです。');
}
