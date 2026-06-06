import type { AppLocale } from '@/services/localeService';

export type DailyNotificationCopy = {
  title: string;
  body: string;
};

export const dailyNotificationMessages: Record<AppLocale, DailyNotificationCopy[]> = {
  ja: [
    {
      title: 'ぽっぽからの呼び出し',
      body: '今日も街にハトはいる。あなたがいないだけ、ではない。',
    },
    {
      title: '公的お知らせ',
      body: '近所のハトが待機中です。帰宅ではありません。スキャンのみ。',
    },
    {
      title: '未判定のハト',
      body: '名前のないハトが1羽、コレクションの空き席で座っています。',
    },
    {
      title: '毎日ハト',
      body: 'カレンダーが1日進みました。ハトは進みません。美しい。',
    },
    {
      title: '鳴き声が聞こえた？',
      body: 'スマホがハトになりかけています。早く撮影して元に戻してください。',
    },
    {
      title: '通報なし',
      body: '今日のハトはまだ誰も通報していません。チャンスです。',
    },
    {
      title: '天気予報：ハト',
      body: '全国ハトかもしれない。傘は不要。カメラは必要。',
    },
    {
      title: '図鑑が寂しい',
      body: 'ページをめくる音だけが響いています。リーダーはあなたです。',
    },
    {
      title: '404羽目ではない',
      body: 'でも今日の1羽目はまだ空いています。急がなくて大丈夫。',
    },
    {
      title: 'ハト大使より',
      body: '外交関係はゼロのまま。街歩きは許可されています。',
    },
    {
      title: '理不尽クエスト更新',
      body: '報酬はありません。でもハトはいます。文句は受け付けません。',
    },
    {
      title: 'POPPO NEWS',
      body: '科学者は「なぜハト？」と言いました。我々は「なぜ撮らない？」と答えました。',
    },
    {
      title: '記録更新のお知らせ',
      body: '昨日のスキャン数：気にしなくてOK。今日は別の日です。',
    },
    {
      title: 'ハトが見ている',
      body: 'サングラス越しに。パンは持っていません。あなたが持ってください。',
    },
    {
      title: '品種不明のまま',
      body: '未判定でも愛は成立します。哲学より先にシャッター。',
    },
    {
      title: '緊急ではない速報',
      body: '公園のベンチで何かが動きました。ハトの可能性が高いです。',
    },
    {
      title: '週刊ぽっぽ',
      body: '今週の特集：「あなたの足元にもハト」編。読者投稿募集中。',
    },
    {
      title: 'ハト監視システム',
      body: '異常なし。正常にハトがいます。日常を享受してください。',
    },
    {
      title: 'コレクション部より',
      body: '空き棚が増え続けています。美術館が悲鳴を上げています（嘘）。',
    },
    {
      title: '午前のハト',
      body: '朝食前のハトはややふわふわです。撮影推奨。保証はしません。',
    },
    {
      title: '最終リマインド',
      body: '今日撮らないハトは、明日もいます。安心してください。撮ってください。',
    },
  ],
  en: [
    {
      title: 'Poppo is calling',
      body: 'Pigeons are still out there. It’s not that you’re gone. They’re just there.',
    },
    {
      title: 'Public notice',
      body: 'A neighborhood pigeon is on standby. Not waiting for you home. Just scanning.',
    },
    {
      title: 'Pending pigeon',
      body: 'A nameless pigeon is sitting in an empty slot in your collection.',
    },
    {
      title: 'Daily pigeon',
      body: 'The calendar moved one day. Pigeons did not. Beautiful.',
    },
    {
      title: 'Did you hear a coo?',
      body: 'Your phone is turning into a pigeon. Scan something to revert it.',
    },
    {
      title: 'No reports filed',
      body: 'Today’s pigeon has not been reported by anyone yet. Your chance.',
    },
    {
      title: 'Forecast: pigeon',
      body: 'Nationwide chance of pigeons. Umbrella useless. Camera required.',
    },
    {
      title: 'Lonely dex',
      body: 'Only page-turning echoes. You are the reader.',
    },
    {
      title: 'Not pigeon #404',
      body: 'But today’s first slot is still open. No rush. It’s open.',
    },
    {
      title: 'From the pigeon envoy',
      body: 'Zero diplomatic relations. Street walks remain authorized.',
    },
    {
      title: 'Unfair quest update',
      body: 'No rewards. Still pigeons. No appeals.',
    },
    {
      title: 'POPPO NEWS',
      body: 'Scientists asked “why pigeons?” We answered “why not scan?”',
    },
    {
      title: 'Record update',
      body: 'Yesterday’s scan count: don’t worry about it. Today is a new day.',
    },
    {
      title: 'A pigeon is watching',
      body: 'Through sunglasses. No bread. Please bring the camera.',
    },
    {
      title: 'Still “unknown”',
      body: 'Love works without a breed label. Philosophy later, shutter now.',
    },
    {
      title: 'Non-urgent bulletin',
      body: 'Something moved on a park bench. Pigeon probability: high.',
    },
    {
      title: 'Weekly Poppo',
      body: 'This week: “Pigeons at your feet.” Reader submissions open.',
    },
    {
      title: 'Pigeon monitoring',
      body: 'All normal. Pigeons present as expected. Enjoy your day.',
    },
    {
      title: 'Collection dept.',
      body: 'Empty shelves keep growing. The museum screams (not really).',
    },
    {
      title: 'Morning pigeon',
      body: 'Pre-breakfast pigeons are extra fluffy. Scan recommended. No warranty.',
    },
    {
      title: 'Final reminder',
      body: 'Pigeons you skip today will still be here tomorrow. Reassuring. Scan anyway.',
    },
  ],
};

export function pickDailyNotification(
  date: Date,
  locale: AppLocale,
): DailyNotificationCopy {
  const pool = dailyNotificationMessages[locale];
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return pool[dayIndex % pool.length] ?? pool[0];
}
