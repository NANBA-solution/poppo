import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import Constants from 'expo-constants';

export type PigeonScanJson = {
  breed: string;
  nickname: string;
};

type ClaudeImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODELS = ['claude-haiku-4-5-20251001'] as const;

const PROMPT = [
  'あなたはハトの専門家兼お笑い芸人です。この写真のハトをガチ判定し、ネットミーム風のシュールな二つ名を1つ生成してください。',
  '返答は必ずJSON形式で { "breed": "品種名", "nickname": "二つ名" } としてください。',
  '説明文やマークダウン、コードブロックは出力しないでください。',
].join('');

function readConfig(key: string): string {
  const fromEnv = process.env[key as keyof NodeJS.ProcessEnv];
  const fromExtra = Constants.expoConfig?.extra?.[key];
  const value =
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    (typeof fromExtra === 'string' && fromExtra.trim()) ||
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

async function requestViaProxy(
  model: string,
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson> {
  const base = getApiBaseUrl();
  const secret = getApiSecret();
  const res = await fetch(`${base}/api/analyze-pigeon`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-poppo-secret': secret } : {}),
    },
    body: JSON.stringify({ model, base64, mediaType }),
  });

  const json = (await res.json()) as {
    breed?: string;
    nickname?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(json.error ?? `API エラー (${res.status})`);
  }
  if (typeof json.breed !== 'string' || typeof json.nickname !== 'string') {
    throw new Error('API の応答形式が不正です。');
  }
  return { breed: json.breed.trim(), nickname: json.nickname.trim() };
}

async function requestClaudeDirect(
  model: string,
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
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
    error?: { type?: string; message?: string };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(formatAnthropicError(res.status, json));
  }

  const text = json.content?.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude からテキスト応答がありませんでした。');
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

function parsePigeonJson(text: string): PigeonScanJson {
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

async function requestWithFallback(
  base64: string,
  mediaType: ClaudeImageMediaType,
): Promise<PigeonScanJson> {
  const primary = getModel();
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const request = useProxy() ? requestViaProxy : requestClaudeDirect;

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await request(model, base64, mediaType);
    } catch (e) {
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

/** 撮影画像を Claude API に送り、品種と二つ名を取得する */
export async function analyzePigeonWithClaude(imageUri: string): Promise<PigeonScanJson> {
  ensureAiConfigured();
  const { base64, mediaType } = await imageUriToBase64(imageUri);
  return requestWithFallback(base64, mediaType);
}
