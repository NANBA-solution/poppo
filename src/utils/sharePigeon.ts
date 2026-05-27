import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export function buildShareCaption(breed: string, nickname: string): string {
  return `【${breed}】${nickname}\n#ぽっぽ #POPPO`;
}

/** キャプチャ画像を共有する（Expo Go 実機では expo-sharing が最も安定） */
export async function sharePigeonImageWithFallback(
  fileUri: string,
  breed: string,
  nickname: string,
): Promise<{ captionCopied: boolean }> {
  if (!fileUri?.trim()) {
    throw new Error('共有する画像がありません。');
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(
      Platform.OS === 'web'
        ? 'Web では共有シートを利用できません。'
        : 'この環境では共有を利用できません。',
    );
  }

  let captionCopied = false;
  if (Platform.OS !== 'web') {
    try {
      await Clipboard.setStringAsync(buildShareCaption(breed, nickname));
      captionCopied = true;
    } catch {
      // クリップボード失敗は画像シェアを妨げない
    }
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'ぽっぽをシェア',
    UTI: 'public.jpeg',
  });

  return { captionCopied };
}
