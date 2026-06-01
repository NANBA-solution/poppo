import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { ActionFooter, FooterButton } from '@/components/ui/ActionFooter';
import { Screen } from '@/components/ui/Screen';
import { useI18n } from '@/i18n/I18nProvider';
import { analyzePigeonWithClaude, type PigeonScanJson } from '@/services/aiService';
import { savePigeonScan } from '@/services/collectionService';
import { colors } from '@/theme/tokens';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
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
  const { t } = useI18n();
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
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    if (!imageUri) {
      setAiPhase('idle');
      setAiResult(null);
      setAiError(null);
      setSavedEntryId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setAiPhase('loading');
      setAiResult(null);
      setAiError(null);
      setSavedEntryId(null);
      try {
        const result = await analyzePigeonWithClaude(imageUri);
        if (!cancelled) {
          setAiResult(result);
          setAiPhase('success');
          void hapticSuccess();
          try {
            const entry = await savePigeonScan(imageUri, result);
            if (!cancelled) {
              setSavedEntryId(entry.id);
            }
          } catch {
            // 保存失敗は判定表示を妨げない
          }
        }
      } catch (e) {
        if (!cancelled) {
          void hapticWarning();
          setAiError(
            e instanceof Error ? e.message : t.scan.analyzeFailed,
          );
          setAiPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUri, retryKey, t]);

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
        t.common.shareError,
        e instanceof Error ? e.message : t.common.shareFailed,
      );
    } finally {
      setShareBusy(false);
    }
  }, [aiResult, imageUri, shareBusy, t.common.shareError, t.common.shareFailed]);

  const cardPhase = aiPhase === 'idle' ? 'loading' : aiPhase;

  return (
    <Screen edges={false}>
      <View style={[styles.stage, { paddingTop: insets.top }]}>
        {imageUri ? (
          <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
            <ShareCaptureFrame
              imageUri={imageUri}
              phase={cardPhase}
              result={aiResult}
              error={aiError}
              minimal
            />
          </View>
        ) : (
          <Text style={styles.missing}>{t.scan.missingUri}</Text>
        )}
      </View>

      <ActionFooter>
        {aiPhase === 'success' && savedEntryId && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/entry/[id]', params: { id: savedEntryId } })
            }
            style={({ pressed }) => [styles.savedLink, pressed && styles.pressed]}
          >
            <Text style={styles.savedLinkText}>
              {t.scan.saved} · {t.scan.savedAction}
            </Text>
          </Pressable>
        )}
        <View style={styles.footerRow}>
          <FooterButton
            label={t.common.share}
            onPress={handleShare}
            disabled={!imageUri || shareBusy || aiPhase !== 'success' || !aiResult}
            loading={shareBusy}
          />
          {aiPhase === 'error' ? (
            <FooterButton
              label={t.scan.retry}
              variant="secondary"
              onPress={handleRetry}
            />
          ) : (
            <FooterButton
              label={t.scan.retake}
              variant="ghost"
              onPress={() => router.back()}
            />
          )}
        </View>
      </ActionFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 0,
  },
  shareWrap: {
    flex: 1,
  },
  missing: {
    flex: 1,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 16,
    padding: 24,
  },
  savedLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  savedLinkText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
