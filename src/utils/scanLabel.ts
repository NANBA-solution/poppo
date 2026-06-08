import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import type { AppLocale } from '@/services/localeService';
import { en } from '@/i18n/locales/en';
import { ja } from '@/i18n/locales/ja';

const dictionaries: Record<AppLocale, TranslationTree> = { ja, en };

function padScanNo(n: number): string {
  return String(n).padStart(3, '0');
}

/** コレクション上のスキャン表示ラベル（初回は特別文言） */
export function formatScanLabel(n: number, t: TranslationTree): string {
  if (n === 1) return t.profile.scanEntryFirst;
  return formatMessage(t.profile.scanEntry, { n: padScanNo(n) });
}

/** シェア用キャプション */
export function buildShareCaption(scanNo: number, locale: AppLocale = 'ja'): string {
  const t = dictionaries[locale];
  if (scanNo === 1) return t.share.captionFirst;
  return formatMessage(t.share.caption, { n: padScanNo(scanNo) });
}
