import { PigeonCard } from '@/components/PigeonCard';
import { ScanFramingGuide } from '@/components/ScanFramingGuide';
import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { ActionFooter, FooterButton, FooterTextAction } from '@/components/ui/ActionFooter';
import { Screen } from '@/components/ui/Screen';
import { formatMessage } from '@/i18n/format';
import { formatScanLabel } from '@/utils/scanLabel';
import { useI18n } from '@/i18n/I18nProvider';
import {
  deletePigeonScan,
  getPigeonCollection,
  getPigeonCount,
  savePigeonScan,
  updatePigeonImageFraming,
} from '@/services/collectionService';
import { handleScanGoalAchievement } from '@/services/collectionGoalService';
import { notifyGoalReached } from '@/services/collectionGoalNotificationService';
import { notifyQuestsCompleted } from '@/services/questNotificationService';
import { detectNewQuests, getQuestTitle } from '@/services/questService';
import { recognizePigeonLocally } from '@/services/pigeonDetectService';
import {
  completeScanFramingGuide,
  shouldShowScanFramingGuide,
} from '@/services/scanFramingGuideService';
import { isNotPigeonError } from '@/types/scan';
import type { CardImageFraming, CardRarity } from '@/types/collection';
import { colors } from '@/theme/tokens';
import { getRarityRevealMessage } from '@/utils/rarityLabel';
import {
  DEFAULT_CARD_IMAGE_FRAMING,
  normalizeCardImageFraming,
} from '@/utils/cardImageFraming';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';
import { playQuestComplete, preloadQuestComplete } from '@/utils/questSound';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useTabRouter } from '@/hooks/useTabRouter';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  Alert,
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
  const [savedRarity, setSavedRarity] = React.useState<CardRarity>('N');
  const [savedFlavorIndex, setSavedFlavorIndex] = React.useState(0);
  const [scanNo, setScanNo] = React.useState<number | null>(null);
  const [displayUri, setDisplayUri] = React.useState<string | undefined>(imageUri);
  const [retryKey, setRetryKey] = React.useState(0);
  const [newQuestTitles, setNewQuestTitles] = React.useState<string[]>([]);
  const [imageFraming, setImageFraming] = React.useState<CardImageFraming>(
    DEFAULT_CARD_IMAGE_FRAMING,
  );
  const framingSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [framingGuideVisible, setFramingGuideVisible] = React.useState(false);
  const [framingEditMode, setFramingEditMode] = React.useState(false);
  const [discarding, setDiscarding] = React.useState(false);

  const dismissFramingGuide = React.useCallback(() => {
    setFramingGuideVisible(false);
    void completeScanFramingGuide();
  }, []);

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
      setSavedRarity('N');
      setSavedFlavorIndex(0);
      setScanNo(null);
      setNewQuestTitles([]);
      setImageFraming(DEFAULT_CARD_IMAGE_FRAMING);
      setFramingGuideVisible(false);
      setFramingEditMode(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setPhase('loading');
      setSaveError(null);
      setErrorTitle(undefined);
      setNotPigeon(false);
      setSavedEntryId(null);
      setSavedRarity('N');
      setSavedFlavorIndex(0);
      setScanNo(null);
      setNewQuestTitles([]);
      setImageFraming(DEFAULT_CARD_IMAGE_FRAMING);
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
          setSavedRarity(entry.rarity ?? 'N');
          setSavedFlavorIndex(entry.flavorIndex ?? 0);
          setScanNo(total);
          setDisplayUri(entry.imageUri);
          setImageFraming(normalizeCardImageFraming(entry.imageFraming));
          setNewQuestTitles(questTitles);
          setPhase('success');
          void shouldShowScanFramingGuide().then((show) => {
            if (!cancelled && show) {
              setFramingEditMode(true);
              setFramingGuideVisible(true);
            }
          });
          void hapticSuccess();
          if (newQuestIds.length > 0) {
            void playQuestComplete();
            void notifyQuestsCompleted(questTitles, t, locale);
          }
          const goalAchievement = await handleScanGoalAchievement(
            before.length,
            after.length,
          );
          if (goalAchievement) {
            void notifyGoalReached(
              goalAchievement.completedGoal,
              goalAchievement.nextGoal,
              t,
            );
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

  React.useEffect(() => {
    return () => {
      if (framingSaveTimer.current) clearTimeout(framingSaveTimer.current);
    };
  }, []);

  const handleImageFramingChange = React.useCallback(
    (next: CardImageFraming) => {
      setImageFraming(next);
      if (framingGuideVisible) {
        dismissFramingGuide();
      }
      if (!savedEntryId) return;
      if (framingSaveTimer.current) clearTimeout(framingSaveTimer.current);
      framingSaveTimer.current = setTimeout(() => {
        void updatePigeonImageFraming(savedEntryId, next);
      }, 280);
    },
    [dismissFramingGuide, framingGuideVisible, savedEntryId],
  );

  const handleRetry = React.useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const handleDiscard = React.useCallback(() => {
    if (!savedEntryId || discarding) return;

    Alert.alert(t.scan.discardTitle, t.scan.discardBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            setDiscarding(true);
            await deletePigeonScan(savedEntryId);
            router.back();
          } catch (e) {
            Alert.alert(
              t.common.error,
              e instanceof Error ? e.message : t.entry.deleteError,
            );
          } finally {
            setDiscarding(false);
          }
        },
      },
    ]);
  }, [
    discarding,
    router,
    savedEntryId,
    t.common.cancel,
    t.common.delete,
    t.common.error,
    t.entry.deleteError,
    t.scan.discardBody,
    t.scan.discardTitle,
  ]);

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
  const rarityReveal =
    phase === 'success' ? getRarityRevealMessage(savedRarity, t) : null;

  return (
    <Screen edges={false} pigeons={false}>
      <View style={[styles.stage, { paddingTop: insets.top }]}>
        {displayUri ? (
          <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
            {phase === 'success' && scanNo != null ? (
              <View style={styles.cardStage}>
                <PigeonCard
                  imageUri={displayUri}
                  scanNo={scanNo}
                  rarity={savedRarity}
                  flavorIndex={savedFlavorIndex}
                  entryId={savedEntryId ?? undefined}
                  imageFraming={imageFraming}
                  framingEditable={framingEditMode}
                  onImageFramingChange={handleImageFramingChange}
                  size="share"
                  isActive={!framingEditMode}
                />
                {framingGuideVisible ? (
                  <ScanFramingGuide onDismiss={dismissFramingGuide} />
                ) : null}
              </View>
            ) : (
              <ShareCaptureFrame
                imageUri={displayUri}
                phase={cardPhase}
                scanNo={phase === 'success' ? scanNo : null}
                headline={
                  phase === 'success' && scanNo != null
                    ? formatScanLabel(scanNo, t)
                    : undefined
                }
                ugc={phase === 'success'}
                error={saveError}
                errorTitle={errorTitle}
                subtitle={phase === 'success' ? t.scan.saved : undefined}
                minimal
              />
            )}
          </View>
        ) : (
          <Text style={styles.missing}>{t.scan.missingUri}</Text>
        )}
      </View>

      {(phase === 'success' || phase === 'error') && (
      <ActionFooter>
        {phase === 'success' ? (
          <>
            <View style={styles.statusBlock}>
              {rarityReveal ? (
                <Text style={styles.statusTitle}>{rarityReveal}</Text>
              ) : null}
              <Text style={styles.statusSubtitle}>{t.scan.saved}</Text>
              {newQuestTitles.length > 0 ? (
                <View style={styles.questList}>
                  {newQuestTitles.map((title) => (
                    <Text key={title} style={styles.questLine}>
                      {formatMessage(t.scan.quest, { title })}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            {scanNo != null ? (
              <SocialShareButtons
                shareRef={shareRef}
                scanNo={scanNo}
                disabled={!displayUri || shareBusy || discarding}
                onBusyChange={setSocialBusy}
                layout="icons"
              />
            ) : null}

            <FooterButton
              label={t.common.share}
              onPress={handleShare}
              disabled={!displayUri || shareBusy || socialBusy || discarding}
              loading={shareBusy}
            />

            <FooterButton
              label={framingEditMode ? t.scan.editFramingDone : t.scan.editFraming}
              variant="secondary"
              onPress={() => {
                if (framingEditMode && framingGuideVisible) {
                  dismissFramingGuide();
                }
                setFramingEditMode((on) => !on);
              }}
              disabled={discarding || shareBusy}
            />

            <View style={styles.footerRow}>
              {savedEntryId ? (
                <FooterButton
                  label={t.scan.savedAction}
                  variant="secondary"
                  onPress={() =>
                    router.push({ pathname: '/entry/[id]', params: { id: savedEntryId } })
                  }
                  disabled={discarding || shareBusy}
                />
              ) : null}
              <FooterButton
                label={t.scan.retake}
                variant="ghost"
                onPress={() => router.back()}
                disabled={discarding || shareBusy}
              />
            </View>

            {savedEntryId ? (
              <FooterTextAction
                label={t.common.delete}
                tone="danger"
                onPress={handleDiscard}
                disabled={shareBusy || socialBusy}
                loading={discarding}
              />
            ) : null}

            {framingEditMode ? (
              <Text style={styles.framingHint}>{t.scan.framingHint}</Text>
            ) : null}
          </>
        ) : null}
        {phase === 'error' ? (
          <View style={styles.footerRow}>
            {!notPigeon ? (
              <FooterButton
                label={t.scan.retryRecognize}
                variant="secondary"
                onPress={handleRetry}
              />
            ) : null}
            <FooterButton
              label={t.scan.retake}
              variant={notPigeon ? 'primary' : 'ghost'}
              onPress={() => router.back()}
            />
          </View>
        ) : null}
      </ActionFooter>
      )}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardStage: {
    flex: 1,
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 5 / 7,
    position: 'relative',
  },
  missing: {
    flex: 1,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 16,
    padding: 24,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  questList: {
    marginTop: 4,
    gap: 2,
    alignItems: 'center',
  },
  questLine: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  framingHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
