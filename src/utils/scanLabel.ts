import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import type { AppLocale } from '@/services/localeService';
import { en } from '@/i18n/locales/en';
import { ja } from '@/i18n/locales/ja';

const dictionaries: Record<AppLocale, TranslationTree> = { ja, en };

/** コレクション上のスキャン表示ラベル（例: ポッポ1号） */
export function formatScanLabel(n: number, t: TranslationTree): string {
  return formatMessage(t.profile.scanEntry, { n: String(n) });
}

/** シェア画像ステッカー */
export function formatScanSticker(n: number, t: TranslationTree): string {
  return formatMessage(t.entry.sticker, { n: String(n) });
}

/** シェア用キャプション */
export function buildShareCaption(scanNo: number, locale: AppLocale = 'ja'): string {
  const t = dictionaries[locale];
  return formatMessage(t.share.caption, { n: String(scanNo) });
}
