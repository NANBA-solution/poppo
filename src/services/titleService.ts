export type PlayerTitle = {
  title: string;
  subtitle: string;
  nextTitle: string | null;
  progressLabel: string | null;
};

const TIERS = [
  { min: 0, title: 'そこらへんの人間', subtitle: 'まだハトとすれ違うだけ' },
  { min: 1, title: '公園の見習い', subtitle: 'ぽっぽに目がいく' },
  { min: 3, title: 'パンをくれるタイプ', subtitle: 'ハトに優しい' },
  { min: 7, title: '街のハト通', subtitle: '二つ名が増えてきた' },
  { min: 15, title: '実質ハト', subtitle: '羽ばたきが聞こえる' },
  { min: 30, title: 'ハト界のレジェンド', subtitle: '伝説のぽっぽハンター' },
] as const;

export function getPlayerTitle(scanCount: number): PlayerTitle {
  let current = TIERS[0];
  let next: (typeof TIERS)[number] | null = TIERS[1] ?? null;

  for (let i = 0; i < TIERS.length; i++) {
    if (scanCount >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }

  const progressLabel =
    next != null ? `次の称号まで ${Math.max(0, next.min - scanCount)} 羽` : null;

  return {
    title: current.title,
    subtitle: current.subtitle,
    nextTitle: next?.title ?? null,
    progressLabel,
  };
}
