/**
 * Vercel Serverless: POST /api/analyze-pigeon
 * 環境変数: ANTHROPIC_API_KEY, POPPO_API_SECRET（任意）, ANTHROPIC_MODEL（任意）
 */
const DETECT_PROMPT = [
  '写真にハト／鳩（カワラバト・ドバト等の鳩類）が写っているかだけ判定してください。',
  'スズメ・カラス・ツバメなど他の鳥、人・犬・猫・風景・食べ物は false。',
  'JSON1行のみ: {"is_pigeon":true} または {"is_pigeon":false}',
  '余計な文は禁止。',
].join('\n');

const ANALYZE_PROMPT = [
  'あなたはハト（カワラバト・ドバト等の鳩類）の品種を判定する専門家です。',
  'まず写真にハト／鳩が写っているか厳密に判定し、JSON1行のみ返してください。',
  '',
  '# ハトが写っている場合',
  '- is_pigeon: true',
  '- breed: 品種名（日本語、15文字以内。例：ドバト、カワラバト）',
  '',
  '# ハトが写っていない場合',
  '- is_pigeon: false',
  '- breed: ""',
  '',
  '返答例: {"is_pigeon":true,"breed":"カワラバト"} または {"is_pigeon":false,"breed":""}',
  '余計な文は一切出力禁止。',
].join('\n');

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODELS = ['claude-haiku-4-5-20251001'];

type Body = {
  base64?: string;
  mediaType?: string;
  model?: string;
  mode?: 'detect' | 'analyze';
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
  mode: 'detect' | 'analyze',
): Promise<{ is_pigeon: boolean; breed: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: mode === 'detect' ? 64 : 512,
      temperature: mode === 'detect' ? 0 : 1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: mode === 'detect' ? DETECT_PROMPT : ANALYZE_PROMPT },
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
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude の応答形式が不正です。');
  }
  const row = parsed as Record<string, unknown>;
  const isPigeon = row.is_pigeon === true;
  const breed = typeof row.breed === 'string' ? row.breed.trim() : '';
  if (!isPigeon) {
    return { is_pigeon: false, breed: '' };
  }
  if (mode === 'detect') {
    return { is_pigeon: true, breed: '' };
  }
  if (!breed) {
    throw new Error('品種が取得できませんでした。');
  }
  return { is_pigeon: true, breed };
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

  const mode = body.mode === 'analyze' ? 'analyze' : 'detect';
  const primary = body.model?.trim() || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const result = await callClaude(apiKey, model, base64, mediaType, mode);
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
