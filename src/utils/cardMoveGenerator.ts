import type { AppLocale } from '@/services/localeService';
import type { CardRarity } from '@/types/collection';

export type MoveCost = 'colorless' | 'street';

export type GeneratedCardMove = {
  name: string;
  desc: string;
  costs: MoveCost[];
};

/** 技名はすべて鳩・ハト・ぽっぽ文脈。説明は人が書いたような口語・シュール */
const MOVE_NAMES: Record<AppLocale, readonly string[]> = {
  ja: [
    'パンくずねだり',
    'ベンチドロップ',
    '電線バランス',
    'ぽっぽ連打',
    '鳩ノック',
    '羽ばたきビンタ',
    '路上ストップ',
    '鳩ガード',
    '鳩魂の一撃',
    'ひっぽうコウラ',
    '鳩のまばたき',
    'ガブリペック',
    '鳩タックル',
    '群鳩プレス',
    '鳩だるまさん',
    '鳩視線キメ顔',
    '鳩ぽいジャンプ',
    '足踏み鳩',
    '鳩ノスタルジア',
    '鳩風来坊',
    '超鳩インパクト',
    '鳩混入攻撃',
    '鳩の独白',
    '鳩ソニック',
    '鳩だんご三兄弟',
    '鳩の足音',
    '鳩返し',
    '鳩の気配',
    '鳩ドリル',
    '鳩の逆襲',
    '鳩ぽい威嚇',
    '鳩の休憩',
  ],
  en: [
    'Crumb Beg',
    'Bench Drop',
    'Wire Balance',
    'Poppo Combo',
    'Pigeon Knock',
    'Wing Slap',
    'Sidewalk Stop',
    'Pigeon Guard',
    'Pigeon Soul Hit',
    'Surprise Shell',
    'Pigeon Blink',
    'Beak Bite',
    'Pigeon Tackle',
    'Flock Press',
    'Pigeon Statue',
    'Pigeon Stare',
    'Pigeon Hop',
    'Foot Tap Coo',
    'Pigeon Nostalgia',
    'Pigeon Wind Walk',
    'Ultra Pigeon Hit',
    'Flock Blend',
    'Pigeon Monologue',
    'Pigeon Sonic',
    'Triple Pigeon Ball',
    'Pigeon Footsteps',
    'Pigeon Reversal',
    'Pigeon Aura',
    'Pigeon Drill',
    'Pigeon Counter',
    'Pigeon Intimidate',
    'Pigeon Nap',
  ],
};

const MOVE_DESCS: Record<AppLocale, readonly string[]> = {
  ja: [
    'パンを期待して前に出る。パンは出ない。出たこともない。',
    '使った本人がいちばんびっくりしてる。周りは見てるだけ。',
    '近くのハトに「やめとけ」と言われた気がする。気のせいかも。',
    '当たればけっこう痛い。当たるかは今日の気分次第。',
    '撃ったあと地面を見つめる。深い。意味はない。',
    '鳩仲間が集まってきた。仲間かどうかは誰も確認してない。',
    '謝らない。謝る概念をまだ教わってない。',
    'たまに自分の羽に当たる。本人は気にしていない。',
    '公園の常連おじいちゃんだけがうなずいた。',
    '子どもが指差した。親が「見ないで」と言った。',
    'カラスが遠くで見てた。関係ないけど不安になる。',
    'パン屋の人が睨んだ。買ってないから当然。',
    '効果はあるらしい。誰も測定してない。',
    '次のターンのことは忘れてる。今が大事。',
    '鳴き声が少し大きかった。本人は満足そう。',
    'ベンチの上のハトが譲ってくれた。礼は言わなかった。',
    '電線がゆれてる。電気は関係ない。風だ。',
    '「強い」と言いたいだけ。根拠はない。',
    '使うたびに少し恥ずかしそう。少しだけ。',
    '開発者も何が起きるか把握してない。ハトも。',
    '道行く人が避けた。ハトは道を塞いでない。',
    '勝ったかどうかより、とりあえず鳩だった。',
    '説明を読む人にだけ申し訳ない気持ちになる。',
    '実はただ歩いてるだけのことがある。それも鳩。',
    'この技を使ったハトはその後も普通に餌を探した。',
    '強さの星が増えた気がする。増えてない。',
    'カードに書いてあるから信じてほしい。ハトは知らない。',
    '見た目は派手。中身はいつものハト。',
    '使う側も使われる側もハトではないことが多い。',
    '最後にぽっぽと鳴いた。挨拶か威嚇かは不明。',
  ],
  en: [
    'Steps forward hoping for bread. There is no bread. Never was.',
    'Surprises itself the most. Everyone else just watches.',
    'Nearby pigeons seem to say "don\'t." Might be imagination.',
    'Hurts if it lands. Landing is a today kind of question.',
    'Stares at the ground after. Deep. Means nothing.',
    'More pigeons gather. Nobody checks if they\'re friends.',
    'No apology. Hasn\'t learned the concept yet.',
    'Sometimes hits its own wing. Doesn\'t seem to mind.',
    'Only the park regular nodded.',
    'A kid pointed. Parent said "don\'t look."',
    'A crow watched from far away. Unrelated but worrying.',
    'Bakery staff glared. Fair—you didn\'t buy anything.',
    'Probably works. Nobody measured.',
    'Forgot about next turn. Living in the moment.',
    'Coo was a little loud. Seemed proud though.',
    'Bench pigeon moved over. No thanks given.',
    'Wire is swaying. Not electricity. Just wind.',
    'Wants to feel strong. No evidence.',
    'Looks slightly embarrassed each time. Slightly.',
    'Dev team doesn\'t know either. Pigeon neither.',
    'Pedestrians swerved. Pigeon wasn\'t blocking.',
    'More important that it was a pigeon than winning.',
    'Sorry only to whoever reads this flavor text.',
    'Sometimes it\'s just walking. Still counts.',
    'After this move it went back to looking for food.',
    'Felt like more stars. There aren\'t.',
    'Believe it because the card says so. Pigeon won\'t confirm.',
    'Looks flashy. Inside it\'s the usual pigeon.',
    'User and target are usually not pigeons.',
    'Ended with a coo. Greeting or threat—unknown.',
  ],
};

function seededUnit(seed: string, salt: string): number {
  const text = `${seed}:${salt}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

function pick<T>(items: readonly T[], unit: number): T {
  const index = Math.floor(unit * items.length) % items.length;
  return items[index] ?? items[0]!;
}

function pickMoveName(
  seed: string,
  slot: 1 | 2,
  locale: AppLocale,
  avoid?: string,
): string {
  const names = MOVE_NAMES[locale];
  let unit = seededUnit(seed, `name-${slot}`);
  let name = pick(names, unit);
  if (avoid && name === avoid) {
    unit = seededUnit(seed, `name-${slot}-alt`);
    name = pick(names, (unit + 0.37) % 1);
    if (name === avoid) {
      const idx = (Math.floor(unit * names.length) + 1) % names.length;
      name = names[idx] ?? names[0]!;
    }
  }
  return name;
}

function buildCosts(slot: 1 | 2, rarity: CardRarity, unit: number): MoveCost[] {
  const heavy = rarity === 'SR' || rarity === 'UR' || rarity === 'SECRET';
  if (slot === 1) {
    return unit > 0.55 ? ['street', 'colorless'] : ['colorless'];
  }
  if (heavy) {
    if (unit > 0.66) return ['street', 'street', 'street'];
    if (unit > 0.33) return ['street', 'street', 'colorless'];
    return ['street', 'street'];
  }
  if (unit > 0.5) return ['street', 'street', 'colorless'];
  return ['street', 'colorless'];
}

function generateMove(
  seed: string,
  slot: 1 | 2,
  locale: AppLocale,
  rarity: CardRarity,
  otherName?: string,
): GeneratedCardMove {
  const name = pickMoveName(seed, slot, locale, otherName);
  const desc = pick(MOVE_DESCS[locale], seededUnit(seed, `desc-${slot}`));
  return {
    name,
    desc,
    costs: buildCosts(slot, rarity, seededUnit(seed, `cost-${slot}`)),
  };
}

export function buildMoveSeed(entryId: string | undefined, scanNo: number, flavorIndex: number): string {
  if (entryId) return entryId;
  return `scan-${scanNo}-flavor-${flavorIndex}`;
}

/** カードごとに固定のわざ2つを自動生成 */
export function generateCardMoves(params: {
  seed: string;
  locale: AppLocale;
  rarity: CardRarity;
}): [GeneratedCardMove, GeneratedCardMove] {
  const move1 = generateMove(params.seed, 1, params.locale, params.rarity);
  const move2 = generateMove(params.seed, 2, params.locale, params.rarity, move1.name);
  return [move1, move2];
}
