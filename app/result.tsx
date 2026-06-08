import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { ActionFooter, FooterButton } from '@/components/ui/ActionFooter';
import { Screen } from '@/components/ui/Screen';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import {
  getPigeonCollection,
  getPigeonCount,
  savePigeonScan,
} from '@/services/collectionService';
import { notifyQuestsCompleted } from '@/services/questNotificationService';
import { detectNewQuests, getQuestTitle } from '@/services/questService';
import { recognizePigeonLocally } from '@/services/pigeonDetectService';
import { isNotPigeonError } from '@/types/scan';
import { colors } from '@/theme/tokens';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';
import { playQuestComplete, preloadQuestComplete } from '@/utils/questSound';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useTabRouter } from '@/hooks/useTabRouter';
import { useLocalSearchParams } from 'expo-router';
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
  const router = useTabRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { uri: uriParam } = useLocalSearchParams<{ uri?: string | string[] }>();
  const imageUri = resolveUri(uriParam);

  const shareRef = React.useRef<View>(null);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [socialBusy, setSocialBusy] = React.useState(false);
  const [phase, setPhase] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [errorTitle, setErrorTitle] = React.useState<string | undefined>();
  const [notPigeon, setNotPigeon] = React.useState(false);
  const [savedEntryId, setSavedEntryId] = React.useState<string | null>(null);
  const [scanNo, setScanNo] = React.useState<number | null>(null);
  const [displayUri, setDisplayUri] = React.useState<string | undefined>(imageUri);
  const [retryKey, setRetryKey] = React.useState(0);
  const [newQuestTitles, setNewQuestTitles] = React.useState<string[]>([]);

  React.useEffect(() => {
    preloadQuestComplete();
  }, []);

  React.useEffect(() => {
    setDisplayUri(imageUri);
  }, [imageUri]);

  React.useEffect(() => {
    if (!imageUri) {
      setPhase('idle');
      setSaveError(null);
      setErrorTitle(undefined);
      setNotPigeon(false);
      setSavedEntryId(null);
      setScanNo(null);
      setNewQuestTitles([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setPhase('loading');
      setSaveError(null);
      setErrorTitle(undefined);
      setNotPigeon(false);
      setSavedEntryId(null);
      setScanNo(null);
      setNewQuestTitles([]);
      try {
        await recognizePigeonLocally(imageUri);
        const before = await getPigeonCollection();
        const entry = await savePigeonScan(imageUri, {
          isPigeon: true,
          breed: PENDING_BREED,
        });
        if (!cancelled) {
          const after = await getPigeonCollection();
          const newQuestIds = detectNewQuests(before, after, t);
          const questTitles = newQuestIds.map((id) => getQuestTitle(id, t));
          const total = await getPigeonCount();
          setSavedEntryId(entry.id);
          setScanNo(total);
          setDisplayUri(entry.imageUri);
          setNewQuestTitles(questTitles);
          setPhase('success');
          void hapticSuccess();
          if (newQuestIds.length > 0) {
            void playQuestComplete();
            void notifyQuestsCompleted(questTitles, t, locale);
          }
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
    if (!shareRef.current || !displayUri || shareBusy || phase !== 'success') return;
    try {
      setShareBusy(true);
      const fileUri = await captureRef(shareRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      if (scanNo == null) return;
      await sharePigeonImageWithFallback(fileUri, scanNo, { locale });
    } catch (e) {
      Alert.alert(
        t.common.shareError,
        e instanceof Error ? e.message : t.common.shareFailed,
      );
    } finally {
      setShareBusy(false);
    }
  }, [displayUri, locale, phase, scanNo, shareBusy, t.common.shareError, t.common.shareFailed]);

  const cardPhase = phase === 'idle' ? 'loading' : phase;

  return (
    <Screen edges={false} pigeons={false}>
      <View style={[styles.stage, { paddingTop: insets.top }]}>
        {displayUri ? (
          <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
            <ShareCaptureFrame
              imageUri={displayUri}
              phase={cardPhase}
              headline={
                phase === 'success' && scanNo != null
                  ? formatMessage(t.profile.scanEntry, { n: scanNo })
                  : undefined
              }
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
        {phase === 'success' && newQuestTitles.length > 0 && (
          <View style={styles.questBanner}>
            {newQuestTitles.map((title) => (
              <Text key={title} style={styles.questBannerText}>
                {formatMessage(t.scan.quest, { title })}
              </Text>
            ))}
          </View>
        )}
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
        {phase === 'success' && scanNo != null ? (
          <SocialShareButtons
            shareRef={shareRef}
            scanNo={scanNo}
            disabled={!displayUri || shareBusy}
            onBusyChange={setSocialBusy}
          />
        ) : null}
        <View style={styles.footerRow}>
          {phase === 'success' ? (
            <FooterButton
              label={t.common.share}
              onPress={handleShare}
              disabled={!displayUri || shareBusy || socialBusy}
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
  questBanner: {
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  questBannerText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
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
