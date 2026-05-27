import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { deletePigeonScan, getPigeonById } from '@/services/collectionService';
import type { PigeonEntry } from '@/types/collection';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function EntryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(id) ? id[0] : id;

  const shareRef = React.useRef<View>(null);
  const [entry, setEntry] = React.useState<PigeonEntry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!entryId) {
      setEntry(null);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      const data = await getPigeonById(entryId);
      if (active) {
        setEntry(data);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [entryId]);

  const handleShare = React.useCallback(async () => {
    if (!shareRef.current || !entry || shareBusy) return;
    try {
      setShareBusy(true);
      const fileUri = await captureRef(shareRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      await sharePigeonImageWithFallback(fileUri, entry.breed, entry.nickname);
    } catch (e) {
      Alert.alert(
        'シェアエラー',
        e instanceof Error ? e.message : '画像の共有に失敗しました。',
      );
    } finally {
      setShareBusy(false);
    }
  }, [entry, shareBusy]);

  const handleDelete = React.useCallback(() => {
    if (!entry || deleting) return;

    Alert.alert('コレクションから削除', 'このぽっぽを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deletePigeonScan(entry.id);
            router.back();
          } catch (e) {
            Alert.alert(
              '削除エラー',
              e instanceof Error ? e.message : '削除に失敗しました。',
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [deleting, entry, router]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>ぽっぽ詳細</Text>
        <View style={styles.backSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9d6ee" />
        </View>
      ) : !entry ? (
        <View style={styles.centered}>
          <Text style={styles.missing}>このぽっぽは見つかりませんでした。</Text>
        </View>
      ) : (
        <>
          <View style={styles.stage}>
            <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
              <ShareCaptureFrame
                imageUri={entry.imageUri}
                phase="success"
                result={{ breed: entry.breed, nickname: entry.nickname }}
                subtitle={formatDate(entry.scannedAt)}
                watermark="POPPO COLLECTION"
              />
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {Platform.OS !== 'web' && (
              <SocialShareButtons
                shareRef={shareRef}
                breed={entry.breed}
                nickname={entry.nickname}
                disabled={shareBusy || deleting}
              />
            )}
            <View style={styles.footerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="画像をシェア"
                disabled={shareBusy || deleting}
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed && styles.pressed,
                  (shareBusy || deleting) && styles.btnDisabled,
                ]}
              >
                {shareBusy ? (
                  <ActivityIndicator color="#0a2540" />
                ) : (
                  <Text style={styles.shareBtnLabel}>画像をシェア</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="コレクションから削除"
                disabled={deleting || shareBusy}
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.pressed,
                  (deleting || shareBusy) && styles.btnDisabled,
                ]}
              >
                {deleting ? (
                  <ActivityIndicator color="#ffb4b4" />
                ) : (
                  <Text style={styles.deleteBtnLabel}>削除</Text>
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backLabel: {
    color: '#7CB8FF',
    fontSize: 16,
    fontWeight: '700',
  },
  backSpacer: {
    width: 56,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F7FA',
    fontSize: 18,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missing: {
    color: 'rgba(244,247,250,0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    minHeight: 0,
  },
  shareWrap: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#101016',
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#7CB8FF',
    minHeight: 52,
    justifyContent: 'center',
  },
  shareBtnLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a2540',
  },
  deleteBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,120,120,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,120,120,0.35)',
    minHeight: 52,
  },
  deleteBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffb4b4',
  },
  pressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
