import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { analyzePigeonWithClaude, type PigeonScanJson } from '@/services/aiService';
import { detectNewAchievements } from '@/services/achievementService';
import { getPigeonCollection, savePigeonScan } from '@/services/collectionService';
import { ACHIEVEMENT_DEFS } from '@/types/achievement';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';
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

function resolveUri(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || value.length === 0) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri: uriParam } = useLocalSearchParams<{ uri?: string | string[] }>();
  const imageUri = resolveUri(uriParam);

  const shareRef = React.useRef<View>(null);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [aiPhase, setAiPhase] = React.useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [aiResult, setAiResult] = React.useState<PigeonScanJson | null>(null);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = React.useState<string | null>(null);
  const [newAchievementTitle, setNewAchievementTitle] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    if (!imageUri) {
      setAiPhase('idle');
      setAiResult(null);
      setAiError(null);
      setSavedEntryId(null);
      setNewAchievementTitle(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setAiPhase('loading');
      setAiResult(null);
      setAiError(null);
      setSavedEntryId(null);
      setNewAchievementTitle(null);
      try {
        const before = await getPigeonCollection();
        const result = await analyzePigeonWithClaude(imageUri);
        if (!cancelled) {
          setAiResult(result);
          setAiPhase('success');
          void hapticSuccess();
          try {
            const entry = await savePigeonScan(imageUri, result);
            if (!cancelled) {
              setSavedEntryId(entry.id);
              const after = await getPigeonCollection();
              const newIds = detectNewAchievements(before, after);
              if (newIds.length > 0) {
                const def = ACHIEVEMENT_DEFS.find((d) => d.id === newIds[0]);
                if (def) setNewAchievementTitle(def.title);
              }
            }
          } catch {
            // 保存失敗は判定表示を妨げない
          }
        }
      } catch (e) {
        if (!cancelled) {
          void hapticWarning();
          setAiError(
            e instanceof Error ? e.message : '判定に失敗しました。時間をおいて試してください。',
          );
          setAiPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUri, retryKey]);

  const handleRetry = React.useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const handleShare = React.useCallback(async () => {
    if (!shareRef.current || !imageUri || !aiResult || shareBusy) return;
    try {
      setShareBusy(true);
      const fileUri = await captureRef(shareRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      await sharePigeonImageWithFallback(fileUri, aiResult.breed, aiResult.nickname);
    } catch (e) {
      Alert.alert(
        'シェアエラー',
        e instanceof Error ? e.message : '画像の共有に失敗しました。',
      );
    } finally {
      setShareBusy(false);
    }
  }, [aiResult, imageUri, shareBusy]);

  const cardPhase = aiPhase === 'idle' ? 'loading' : aiPhase;

  return (
    <View style={styles.root}>
      <View style={[styles.stage, { paddingTop: insets.top }]}>
        {imageUri ? (
          <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
            <ShareCaptureFrame
              imageUri={imageUri}
              phase={cardPhase}
              result={aiResult}
              error={aiError}
            />
          </View>
        ) : (
          <Text style={styles.missing}>画像の URI がありません。</Text>
        )}
      </View>

      {aiPhase === 'success' && savedEntryId && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="コレクションの詳細を見る"
          onPress={() =>
            router.push({ pathname: '/entry/[id]', params: { id: savedEntryId } })
          }
          style={({ pressed }) => [styles.savedBanner, pressed && styles.btnPressed]}
        >
          <Text style={styles.savedBannerText}>✓ コレクションに保存しました · 詳細を見る</Text>
        </Pressable>
      )}

      {newAchievementTitle && (
        <View style={styles.achievementBanner}>
          <Text style={styles.achievementBannerText}>
            🏆 実績解除: {newAchievementTitle}
          </Text>
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {Platform.OS !== 'web' && aiPhase === 'success' && aiResult && (
          <SocialShareButtons
            shareRef={shareRef}
            breed={aiResult.breed}
            nickname={aiResult.nickname}
            disabled={shareBusy}
          />
        )}
        <View style={styles.footerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="結果を画像としてシェア"
            disabled={!imageUri || shareBusy || aiPhase !== 'success' || !aiResult}
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareBtn,
              pressed && styles.btnPressed,
              (!imageUri || shareBusy || aiPhase !== 'success' || !aiResult) && styles.btnDisabled,
            ]}
          >
            {shareBusy ? (
              <ActivityIndicator color="#0a2540" />
            ) : (
              <Text style={styles.shareBtnLabel}>画像をシェア</Text>
            )}
          </Pressable>
          {aiPhase === 'error' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="判定を再試行"
              onPress={handleRetry}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.retryBtnLabel}>再判定</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="撮影し直す"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.retakeBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.retakeBtnLabel}>撮影し直す</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  stage: {
    flex: 1,
    minHeight: 0,
  },
  shareWrap: {
    flex: 1,
  },
  missing: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 16,
    padding: 24,
  },
  savedBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(124,184,255,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.35)',
  },
  savedBannerText: {
    color: '#c9d6ee',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,80,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,200,80,0.35)',
  },
  achievementBannerText: {
    color: '#ffd98a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  retryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,180,100,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,180,100,0.4)',
    justifyContent: 'center',
  },
  retryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffd4a8',
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  retakeBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
