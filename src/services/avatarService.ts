import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

import type { PigeonEntry } from '@/types/collection';

const AVATAR_KEY = '@poppo/avatar/v2';
export const DEFAULT_AVATAR_ID = 'jk';

export type AvatarSkin = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  unlockHint?: string;
};

export const AVATAR_SKINS: AvatarSkin[] = [
  {
    id: 'ol',
    name: 'OLな鳩',
    image: require('../../assets/avatars/avatar-ol.png'),
  },
  {
    id: 'salaryman',
    name: 'サラリーマンな鳩',
    image: require('../../assets/avatars/avatar-salaryman.png'),
  },
  {
    id: 'gyaru',
    name: 'ギャルな鳩',
    image: require('../../assets/avatars/avatar-gyaru.png'),
  },
  {
    id: 'student',
    name: '学生な鳩',
    image: require('../../assets/avatars/avatar-student.png'),
  },
  {
    id: 'yankee',
    name: 'ヤンキーな鳩',
    image: require('../../assets/avatars/avatar-yankee.png'),
  },
  {
    id: 'jk',
    name: 'JKな鳩',
    image: require('../../assets/avatars/avatar-jk.png'),
  },
];

const AVATAR_IDS = new Set(AVATAR_SKINS.map((s) => s.id));

function isUnlocked(_id: string, _entries: PigeonEntry[]): boolean {
  return true;
}

export function getAvatarSkin(id: string): AvatarSkin {
  return AVATAR_SKINS.find((s) => s.id === id) ?? AVATAR_SKINS.find((s) => s.id === DEFAULT_AVATAR_ID)!;
}

export function getUnlockedAvatarIds(entries: PigeonEntry[]): Set<string> {
  return new Set(AVATAR_SKINS.filter((s) => isUnlocked(s.id, entries)).map((s) => s.id));
}

export async function getSelectedAvatarId(entries: PigeonEntry[]): Promise<string> {
  const unlocked = getUnlockedAvatarIds(entries);
  const saved = (await AsyncStorage.getItem(AVATAR_KEY)) ?? '';
  if (saved && AVATAR_IDS.has(saved) && unlocked.has(saved)) return saved;
  if (unlocked.has(DEFAULT_AVATAR_ID)) return DEFAULT_AVATAR_ID;
  return AVATAR_SKINS.find((s) => unlocked.has(s.id))?.id ?? DEFAULT_AVATAR_ID;
}

export async function setSelectedAvatarId(id: string): Promise<void> {
  await AsyncStorage.setItem(AVATAR_KEY, id);
}
