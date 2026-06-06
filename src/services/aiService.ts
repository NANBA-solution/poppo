import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import Constants from 'expo-constants';

export type PigeonScanJson = {
  isPigeon: true;
  breed: string;
};

/** ハト以外の写真 */
export class NotPigeonError extends Error {
  constructor() {
    super('NOT_PIGEON');
    this.name = 'NotPigeonError';
  }
}

export function isNotPigeonError(error: unknown): error is NotPigeonError {
  return error instanceof NotPigeonError;
}

type ClaudeImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODELS = ['claude-haiku-4-5-20251001'] as const;

type AiMode = 'detect' | 'analyze';

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
  '- 品種が不明でも is_pigeon は true のまま、見た目に最も近い品種を推定',
  '',
  '# ハトが写っていない場合（人・犬・猫・風景・食べ物・他の鳥など）',
  '- is_pigeon: false',
  '- breed: ""（空文字）',
  '',
  '返答例: {"is_pigeon":true,"breed":"カワラバト"} または {"is_pigeon":false,"breed":""}',
  '余計な文は一切出力禁止。',
].join('\n');

function readConfig(key: string): string {
  // app.config.js の extra を優先（Metro が process.env を空で埋め込むことがある）
  const fromExtra = Constants.expoConfig?.extra?.[key];
  const fromEnv = process.env[key as keyof NodeJS.ProcessEnv];
  const value =
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    '';
  return value;
}

function getApiBaseUrl(): string {
  return readConfig('EXPO_PUBLIC_API_BASE_URL').replace(/\/$/, '');
}

function getApiSecret(): string {
  return readConfig('EXPO_PUBLIC_POPPO_API_SECRET');
}

function getApiKey(): string {
  return readConfig('EXPO_PUBLIC_ANTHROPIC_API_KEY');
}

function getModel(): string {
  const model = readConfig('EXPO_PUBLIC_ANTHROPIC_MODEL');
  return model || DEFAULT_MODEL;
}

function useProxy(): boolean {
  return getApiBaseUrl().length > 0;
}

function ensureAiConfigured(): void {
  if (useProxy()) return;
  if (getApiKey()) return;
  throw new Error(
    'API が未設定です。開発時は .env に EXPO_PUBLIC_ANTHROPIC_API_KEY、本番は EXPO_PUBLIC_API_BASE_URL を設定してください。',
  );
}

function formatAnthropicError(
  status: number,
  body: { error?: { type?: string; message?: string }; message?: string },
): string {
  const msg = body.error?.message ?? body.message ?? `HTTP ${status}`;
  const type = body.error?.type ?? '';

  if (status === 401 || type === 'authentication_error') {
    return `APIキーが無効です。Console でキーを再発行してください。（${msg}）`;
  }
  if (status === 403 || type === 'permission_error') {
    return `APIの利用権限がありません。Billing でクレジットを確認してください。（${msg}）`;
  }
  if (status === 404 || type === 'not_found_error') {
    return `モデルが見つかりません。EXPO_PUBLIC_ANTHROPIC_MODEL を確認してください。（${msg}）`;
  }
  if (status === 429 || type === 'rate_limit_error') {
    return `リクエスト制限に達しました。しばらく待って再試行してください。（${msg}）`;
  }
  if (status === 400 && /credit|balance|billing/i.test(msg)) {
    return `クレジット不足の可能性があります。Anthropic Console の Billing を確認してください。`;
  }
  return msg;
}

function parseDetectResponse(isPigeon: unknown): void {
  if (isPigeon === false) {
    throw new NotPigeonError();
  }
  if (isPigeon !== true) {
    throw new Error('ハト判定の応答形式が不正です。');
  }
}

async function requestViaProxy(
  mode: AiMode,
  model: string,
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson | void> {
  const base = getApiBaseUrl();
  const secret = getApiSecret();
  const res = await fetch(`${base}/api/analyze-pigeon`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-poppo-secret': secret } : {}),
    },
    body: JSON.stringify({ model, base64, mediaType, mode }),
  });

  const json = (await res.json()) as {
    is_pigeon?: boolean;
    breed?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(json.error ?? `API エラー (${res.status})`);
  }
  if (mode === 'detect') {
    parseDetectResponse(json.is_pigeon);
    return;
  }
  return parsePigeonResponse(json.is_pigeon, json.breed);
}

async function requestClaudeDirect(
  mode: AiMode,
  model: string,
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson | void> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getApiKey(),
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
    error?: { type?: string; message?: string };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(formatAnthropicError(res.status, json));
  }

  const text = json.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude からテキスト応答がありませんでした。');
  if (mode === 'detect') {
    return parsePigeonDetectJson(text);
  }
  return parsePigeonJson(text);
}

async function imageUriToBase64(imageUri: string): Promise<{
  base64: string;
  mediaType: ClaudeImageMediaType;
}> {
  const trimmed = imageUri.trim();
  const dataMatch = /^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,(.+)$/i.exec(trimmed);
  if (dataMatch?.[1] && dataMatch[2]) {
    const mime = dataMatch[1].toLowerCase().replace('jpg', 'jpeg') as ClaudeImageMediaType;
    return { base64: dataMatch[2].replace(/\s/g, ''), mediaType: mime };
  }

  let mediaType: ClaudeImageMediaType = 'image/jpeg';
  const lower = trimmed.toLowerCase();
  if (lower.endsWith('.png')) mediaType = 'image/png';
  else if (lower.endsWith('.webp')) mediaType = 'image/webp';
  else if (lower.endsWith('.gif')) mediaType = 'image/gif';

  const base64 = await readAsStringAsync(trimmed, { encoding: EncodingType.Base64 });
  return { base64, mediaType };
}

function extractJsonObject(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/im.exec(t);
  if (fence?.[1]) return fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

function parsePigeonResponse(isPigeon: unknown, breed: unknown): PigeonScanJson {
  if (isPigeon === false) {
    throw new NotPigeonError();
  }
  if (typeof breed !== 'string' || !breed.trim()) {
    throw new Error('品種が取得できませんでした。');
  }
  return { isPigeon: true, breed: breed.trim() };
}

function parsePigeonJson(text: string): PigeonScanJson {
  const parsed: unknown = JSON.parse(extractJsonObject(text));
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude の応答形式が不正です。');
  }
  const row = parsed as Record<string, unknown>;
  return parsePigeonResponse(row.is_pigeon, row.breed);
}

function parsePigeonDetectJson(text: string): void {
  const parsed: unknown = JSON.parse(extractJsonObject(text));
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Claude の応答形式が不正です。');
  }
  const row = parsed as Record<string, unknown>;
  parseDetectResponse(row.is_pigeon);
}

async function requestWithFallback(
  mode: AiMode,
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson | void> {
  const primary = getModel();
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const request = useProxy() ? requestViaProxy : requestClaudeDirect;

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await request(mode, model, base64, mediaType);
    } catch (e) {
      if (isNotPigeonError(e)) {
        throw e;
      }
      lastError = e instanceof Error ? e : new Error(String(e));
      const retryable =
        lastError.message.includes('モデルが見つかりません') ||
        lastError.message.includes('not_found');
      if (!retryable || model === models[models.length - 1]) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error('判定に失敗しました。');
}

/** 写真にハト／鳩が写っているかだけ判定する（品種判定はしない） */
export async function recognizePigeonInPhoto(imageUri: string): Promise<void> {
  ensureAiConfigured();
  if (__DEV__) {
    console.log(
      `[poppo] recognizePigeon: ${useProxy() ? `proxy ${getApiBaseUrl()}` : 'direct Anthropic'}`,
    );
  }
  const { base64, mediaType } = await imageUriToBase64(imageUri);
  await requestWithFallback('detect', base64, mediaType);
  if (__DEV__) {
    console.log('[poppo] recognizePigeon: ok');
  }
}

/** 撮影画像を Claude API に送り、品種を取得する */
export async function analyzePigeonWithClaude(imageUri: string): Promise<PigeonScanJson> {
  ensureAiConfigured();
  const { base64, mediaType } = await imageUriToBase64(imageUri);
  const result = await requestWithFallback('analyze', base64, mediaType);
  if (!result) {
    throw new Error('品種が取得できませんでした。');
  }
  return result;
}
