import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranslationTree } from '@/i18n/locales/ja';
import type { ImageSourcePropType } from 'react-native';

import type { PigeonEntry } from '@/types/collection';

const AVATAR_KEY = '@poppo/avatar/v2';
export const DEFAULT_AVATAR_ID = 'jk';

export type AvatarSkinId = 'ol' | 'salaryman' | 'gyaru' | 'student' | 'yankee' | 'jk';

export type AvatarSkin = {
  id: AvatarSkinId;
  image: ImageSourcePropType;
};

const AVATAR_META: AvatarSkin[] = [
  { id: 'ol', image: require('../../assets/avatars/avatar-ol.png') },
  { id: 'salaryman', image: require('../../assets/avatars/avatar-salaryman.png') },
  { id: 'gyaru', image: require('../../assets/avatars/avatar-gyaru.png') },
  { id: 'student', image: require('../../assets/avatars/avatar-student.png') },
  { id: 'yankee', image: require('../../assets/avatars/avatar-yankee.png') },
  { id: 'jk', image: require('../../assets/avatars/avatar-jk.png') },
];

const AVATAR_IDS = new Set(AVATAR_META.map((s) => s.id));

export function getAvatarName(id: string, t: TranslationTree): string {
  const key = id as AvatarSkinId;
  return t.profile.avatars[key] ?? id;
}

export function getAvatarSkin(id: string): AvatarSkin {
  return AVATAR_META.find((s) => s.id === id) ?? AVATAR_META.find((s) => s.id === DEFAULT_AVATAR_ID)!;
}

export function getAvatarSkins(): AvatarSkin[] {
  return AVATAR_META;
}

function isUnlocked(_id: string, _entries: PigeonEntry[]): boolean {
  return true;
}

export function getUnlockedAvatarIds(entries: PigeonEntry[]): Set<string> {
  return new Set(AVATAR_META.filter((s) => isUnlocked(s.id, entries)).map((s) => s.id));
}

export async function getSelectedAvatarId(entries: PigeonEntry[]): Promise<string> {
  const unlocked = getUnlockedAvatarIds(entries);
  const saved = (await AsyncStorage.getItem(AVATAR_KEY)) ?? '';
  if (saved && AVATAR_IDS.has(saved as AvatarSkinId) && unlocked.has(saved)) return saved;
  if (unlocked.has(DEFAULT_AVATAR_ID)) return DEFAULT_AVATAR_ID;
  return AVATAR_META.find((s) => unlocked.has(s.id))?.id ?? DEFAULT_AVATAR_ID;
}

export async function setSelectedAvatarId(id: string): Promise<void> {
  await AsyncStorage.setItem(AVATAR_KEY, id);
}

/** @deprecated use getAvatarSkins */
export const AVATAR_SKINS = AVATAR_META;
