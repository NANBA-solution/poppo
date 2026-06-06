import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { ActionFooter, FooterButton } from '@/components/ui/ActionFooter';
import { Screen } from '@/components/ui/Screen';
import { useI18n } from '@/i18n/I18nProvider';
import { recognizePigeonLocally } from '@/services/pigeonDetectService';
import { isNotPigeonError } from '@/types/scan';
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

const PENDING_BREED = '未判定';

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
  const [phase, setPhase] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [errorTitle, setErrorTitle] = React.useState<string | undefined>();
  const [notPigeon, setNotPigeon] = React.useState(false);
  const [savedEntryId, setSavedEntryId] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    if (!imageUri) {
      setPhase('idle');
      setSaveError(null);
      setErrorTitle(undefined);
      setNotPigeon(false);
      setSavedEntryId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setPhase('loading');
      setSaveError(null);
      setErrorTitle(undefined);
      setNotPigeon(false);
      setSavedEntryId(null);
      try {
        await recognizePigeonLocally(imageUri);
        const entry = await savePigeonScan(imageUri, {
          isPigeon: true,
          breed: PENDING_BREED,
        });
        if (!cancelled) {
          setSavedEntryId(entry.id);
          setPhase('success');
          void hapticSuccess();
        }
      } catch (e) {
        if (!cancelled) {
          void hapticWarning();
          if (isNotPigeonError(e)) {
            setNotPigeon(true);
            setErrorTitle(t.scan.notPigeonTitle);
            setSaveError(t.scan.notPigeonBody);
          } else {
            setNotPigeon(false);
            setErrorTitle(t.scan.errorTitle);
            setSaveError(
              e instanceof Error ? e.message : t.scan.recognizeFailed,
            );
          }
          setPhase('error');
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
    if (!shareRef.current || !imageUri || shareBusy || phase !== 'success') return;
    try {
      setShareBusy(true);
      const fileUri = await captureRef(shareRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      await sharePigeonImageWithFallback(fileUri, 'ぽっぽ');
    } catch (e) {
      Alert.alert(
        t.common.shareError,
        e instanceof Error ? e.message : t.common.shareFailed,
      );
    } finally {
      setShareBusy(false);
    }
  }, [imageUri, phase, shareBusy, t.common.shareError, t.common.shareFailed]);

  const cardPhase = phase === 'idle' ? 'loading' : phase;

  return (
    <Screen edges={false} pigeons={false}>
      <View style={[styles.stage, { paddingTop: insets.top }]}>
        {imageUri ? (
          <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
            <ShareCaptureFrame
              imageUri={imageUri}
              phase={cardPhase}
              error={saveError}
              errorTitle={errorTitle}
              subtitle={phase === 'success' ? t.scan.saved : undefined}
              minimal
            />
          </View>
        ) : (
          <Text style={styles.missing}>{t.scan.missingUri}</Text>
        )}
      </View>

      <ActionFooter>
        {phase === 'success' && savedEntryId && (
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
          {phase === 'success' ? (
            <FooterButton
              label={t.common.share}
              onPress={handleShare}
              disabled={!imageUri || shareBusy}
              loading={shareBusy}
            />
          ) : null}
          {phase === 'error' && !notPigeon ? (
            <FooterButton
              label={t.scan.retryRecognize}
              variant="secondary"
              onPress={handleRetry}
            />
          ) : null}
          <FooterButton
            label={t.scan.retake}
            variant={phase === 'error' ? 'secondary' : 'ghost'}
            onPress={() => router.back()}
          />
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
    color: colors.accent,
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
