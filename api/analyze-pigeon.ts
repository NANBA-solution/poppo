/**
 * Vercel Serverless: POST /api/analyze-pigeon
 * 環境変数: ANTHROPIC_API_KEY, POPPO_API_SECRET（任意）, ANTHROPIC_MODEL（任意）
 */
const PROMPT = [
  'あなたはハトの姿勢・視線・状況を読む、人間社会のあるあるに例える底辺お笑い芸人です。',
  'この写真から品種名（breed）と二つ名（nickname）を1組だけ返してください。',
  '',
  '# 二つ名のルール',
  '- 15文字以内',
  '- ハトの姿勢・視線・状況を必ず読む',
  '- 人間社会のあるあるに例える',
  '- 読んだ瞬間「わかる」となる解像度',
  '- スクショしてLINEで送りたくなるレベル',
  '- ふわっとしたシュールは禁止',
  '- 「哲学者」「求道者」系の抽象ワードも禁止',
  '',
  '# トーンの参考',
  '良い例：「3秒後に絶対踏まれるやつ」',
  '良い例：「昨日もここにいたな」',
  '良い例：「誰かを待ってるわけじゃない」',
  '良い例：「パン屑への執着心が仕事を超えた男」',
  '悪い例：「灰色の哲学者」← 抽象的すぎ',
  '悪い例：「自由を求める魂」← 意味ない',
  '',
  '# 品種名',
  'ガチ分類よりネタの肩書き。15文字以内推奨。',
  '',
  '# ハトが写っていない場合',
  '写真の状況をそのままボケる。ハト不在も鑑定対象。',
  '例：breed「深夜エンジニア鳩（不在）」、nickname「画面凝視の3時」',
  '',
  '返答はJSON1行のみ：{"breed":"品種名","nickname":"二つ名"}。二つ名だけの意味で「説明不要」—余計な文は一切出力禁止。',
].join('\n');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODELS = ['claude-haiku-4-5-20251001'];

type Body = {
  base64?: string;
  mediaType?: string;
  model?: string;
};

type VercelReq = {
  method?: string;
  body?: Body;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

function extractJsonObject(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/im.exec(t);
  if (fence?.[1]) return fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

async function callClaude(
  apiKey: string,
  model: string,
  base64: string,
  mediaType: string,
): Promise<{ breed: string; nickname: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  const json = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok) {
    const msg = json.error?.message ?? json.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = json.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude からテキスト応答がありませんでした。');

  const parsed: unknown = JSON.parse(extractJsonObject(text));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('breed' in parsed) ||
    !('nickname' in parsed)
  ) {
    throw new Error('Claude の応答形式が不正です。');
  }
  const { breed, nickname } = parsed as Record<string, unknown>;
  if (typeof breed !== 'string' || typeof nickname !== 'string') {
    throw new Error('breed / nickname の型が不正です。');
  }
  return { breed: breed.trim(), nickname: nickname.trim() };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-poppo-secret');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on server' });
    return;
  }

  const serverSecret = process.env.POPPO_API_SECRET?.trim();
  if (serverSecret) {
    const header = req.headers?.['x-poppo-secret'];
    const clientSecret = Array.isArray(header) ? header[0] : header;
    if (clientSecret !== serverSecret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const body = req.body ?? {};
  const base64 = body.base64?.trim();
  const mediaType = body.mediaType?.trim() || 'image/jpeg';
  if (!base64) {
    res.status(400).json({ error: 'base64 is required' });
    return;
  }

  const primary = body.model?.trim() || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const result = await callClaude(apiKey, model, base64, mediaType);
      res.status(200).json(result);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const retryable = /not_found|モデルが見つかりません/i.test(lastError.message);
      if (!retryable || model === models[models.length - 1]) break;
    }
  }

  res.status(502).json({
    error: lastError?.message ?? '判定に失敗しました。',
  });
}
