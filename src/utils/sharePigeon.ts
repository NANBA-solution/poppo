import { formatMessage } from '@/i18n/format';
import { en } from '@/i18n/locales/en';
import { ja, type TranslationTree } from '@/i18n/locales/ja';
import type { AppLocale } from '@/services/localeService';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const dictionaries: Record<AppLocale, TranslationTree> = { ja, en };

function shareStrings(locale: AppLocale) {
  return dictionaries[locale].share;
}

export function buildShareCaption(scanNo: number, locale: AppLocale = 'ja'): string {
  return formatMessage(shareStrings(locale).caption, { n: scanNo });
}

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('cancel') ||
    msg.includes('dismiss') ||
    msg.includes('did not share') ||
    msg.includes('user denied')
  );
}

type SharePigeonOptions = {
  locale?: AppLocale;
};

/** キャプチャ画像を共有する（Expo Go 実機では expo-sharing が最も安定） */
export async function sharePigeonImageWithFallback(
  fileUri: string,
  scanNo: number,
  options: SharePigeonOptions = {},
): Promise<{ captionCopied: boolean }> {
  const locale = options.locale ?? 'ja';
  const strings = shareStrings(locale);

  if (!fileUri?.trim()) {
    throw new Error(strings.noImage);
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(
      Platform.OS === 'web' ? strings.unavailableWeb : strings.unavailable,
    );
  }

  let captionCopied = false;
  if (Platform.OS !== 'web') {
    try {
      await Clipboard.setStringAsync(buildShareCaption(scanNo, locale));
      captionCopied = true;
    } catch {
      // クリップボード失敗は画像シェアを妨げない
    }
  }

  try {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'image/jpeg',
      dialogTitle: strings.dialogTitle,
      UTI: 'public.jpeg',
    });
  } catch (error) {
    if (isShareCancelled(error)) {
      return { captionCopied };
    }
    throw error;
  }

  return { captionCopied };
}
