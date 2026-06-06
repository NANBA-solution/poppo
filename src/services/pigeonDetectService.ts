import { NotPigeonError } from '@/types/scan';
import { Platform } from 'react-native';

type ImageLabel = {
  text: string;
  confidence: number;
};

type ImageLabelingModule = {
  label: (imageUri: string) => Promise<ImageLabel[]>;
};

/** ML Kit が返しうるハト／鳩関連ラベル */
const PIGEON_LABEL_KEYWORDS = [
  'pigeon',
  'dove',
  'rock dove',
  'feral pigeon',
  'city pigeon',
  'ハト',
  '鳩',
  'カワラバト',
  'ドバト',
] as const;

/** 鳥全般（他ラベルと組み合わせて判定） */
const BIRD_LABEL_KEYWORDS = ['bird', '鳥'] as const;

/** ハト以外とみなすラベル */
const NON_PIGEON_KEYWORDS = [
  'cat',
  'dog',
  'person',
  'human',
  'face',
  'food',
  'car',
  'tree',
  'sky',
  'building',
  '猫',
  '犬',
  '人',
] as const;

const MIN_PIGEON_CONFIDENCE = 0.48;
const MIN_BIRD_CONFIDENCE = 0.62;

function loadImageLabeling(): ImageLabelingModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // 未リンクの dev client では require が失敗する
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-ml-kit/image-labeling') as {
      default?: ImageLabelingModule;
    };
    return mod.default ?? (mod as unknown as ImageLabelingModule);
  } catch {
    return null;
  }
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function matchesKeyword(text: string, keywords: readonly string[]): boolean {
  const value = normalize(text);
  return keywords.some((keyword) => value.includes(normalize(keyword)));
}

function scoreLabels(labels: ImageLabel[]): {
  pigeonScore: number;
  birdScore: number;
  blocked: boolean;
} {
  let pigeonScore = 0;
  let birdScore = 0;
  let blocked = false;

  for (const label of labels) {
    const text = label.text ?? '';
    const confidence = label.confidence ?? 0;
    if (matchesKeyword(text, NON_PIGEON_KEYWORDS) && confidence >= 0.55) {
      blocked = true;
    }
    if (matchesKeyword(text, PIGEON_LABEL_KEYWORDS)) {
      pigeonScore = Math.max(pigeonScore, confidence);
    }
    if (matchesKeyword(text, BIRD_LABEL_KEYWORDS)) {
      birdScore = Math.max(birdScore, confidence);
    }
  }

  return { pigeonScore, birdScore, blocked };
}

function isPigeonFromLabels(labels: ImageLabel[]): boolean {
  const { pigeonScore, birdScore, blocked } = scoreLabels(labels);
  if (blocked && pigeonScore < MIN_PIGEON_CONFIDENCE) {
    return false;
  }
  if (pigeonScore >= MIN_PIGEON_CONFIDENCE) {
    return true;
  }
  return birdScore >= MIN_BIRD_CONFIDENCE && !blocked;
}

let imageLabeling: ImageLabelingModule | null | undefined;

function getImageLabeling(): ImageLabelingModule | null {
  if (imageLabeling === undefined) {
    imageLabeling = loadImageLabeling();
  }
  return imageLabeling;
}

/** 端末内 ML Kit でハト／鳩が写っているか判定（API 通信なし） */
export async function recognizePigeonLocally(imageUri: string): Promise<void> {
  const labeler = getImageLabeling();
  if (!labeler) {
    throw new Error(
      'ローカルハト認識が未インストールです。npm run build:dev:ios:device で再ビルドしてください。',
    );
  }

  const labels = await labeler.label(imageUri);
  if (__DEV__) {
    console.log('[poppo] local labels:', labels.slice(0, 6));
  }
  if (!isPigeonFromLabels(labels)) {
    throw new NotPigeonError();
  }
}
