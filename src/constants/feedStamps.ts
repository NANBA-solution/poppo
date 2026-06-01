import type { TranslationTree } from '@/i18n/locales/ja';
import type { FeedStamp, StampId } from '@/types/feed';

export const STAMP_IDS: StampId[] = [
  'kuruppo',
  'hohoho',
  'gerogero',
  'peewee',
  'bododo',
  'gugu',
];

/** DB 保存用のデフォルトラベル（日本語） */
export function stampLabel(id: StampId): string {
  const labels: Record<StampId, string> = {
    kuruppo: 'クルッポー',
    hohoho: 'ホーホー',
    gerogero: 'ゲロゲロ',
    peewee: 'ピーウィ',
    bododo: 'ボドド',
    gugu: 'グーグー',
  };
  return labels[id] ?? id;
}

export function localizeStampLabel(
  id: StampId,
  stamps: TranslationTree['feed']['stamps'],
): string {
  return stamps[id] ?? stampLabel(id);
}

export function getLocalizedStamps(
  stamps: TranslationTree['feed']['stamps'],
): FeedStamp[] {
  return STAMP_IDS.map((id) => ({
    id,
    label: localizeStampLabel(id, stamps),
    sound: id,
  }));
}
