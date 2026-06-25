import { AppIcon } from '@/components/icons/AppIcon';
import { PigeonCard } from '@/components/PigeonCard';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { ActionFooter, FooterButton, FooterTextAction } from '@/components/ui/ActionFooter';
import { useI18n } from '@/i18n/I18nProvider';
import {
  deletePigeonScan,
  getPigeonById,
  getPigeonCollection,
  getScanNumber,
} from '@/services/collectionService';
import type { PigeonEntry } from '@/types/collection';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import { getRarityLabel } from '@/utils/rarityLabel';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useTabRouter } from '@/hooks/useTabRouter';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EntryDetailScreen() {
  const router = useTabRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(id) ? id[0] : id;

  const shareRef = React.useRef<View>(null);
  const [entry, setEntry] = React.useState<PigeonEntry | null>(null);
  const [scanNo, setScanNo] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [socialBusy, setSocialBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!entryId) {
      setEntry(null);
      setScanNo(null);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      const [data, collection] = await Promise.all([
        getPigeonById(entryId),
        getPigeonCollection(),
      ]);
      if (active) {
        setEntry(data);
        setScanNo(data ? getScanNumber(collection, data.id) : null);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [entryId]);

  const handleShare = React.useCallback(async () => {
    if (!shareRef.current || !entry || scanNo == null || shareBusy) return;
    try {
      setShareBusy(true);
      const fileUri = await captureRef(shareRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      await sharePigeonImageWithFallback(fileUri, scanNo, { locale });
    } catch (e) {
      Alert.alert(
        t.common.shareError,
        e instanceof Error ? e.message : t.common.shareFailed,
      );
    } finally {
      setShareBusy(false);
    }
  }, [entry, locale, scanNo, shareBusy, t.common.shareError, t.common.shareFailed]);

  const handleDelete = React.useCallback(() => {
    if (!entry || deleting) return;

    Alert.alert(t.entry.deleteTitle, t.entry.deleteBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deletePigeonScan(entry.id);
            router.back();
          } catch (e) {
            Alert.alert(
              t.common.error,
              e instanceof Error ? e.message : t.entry.deleteError,
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [deleting, entry, router, t.common.cancel, t.common.delete, t.common.error, t.entry.deleteBody, t.entry.deleteError, t.entry.deleteTitle]);

  const rarity = entry?.rarity ?? 'N';
  const flavorIndex = entry?.flavorIndex ?? 0;

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.onAccent} />
        </View>
      ) : !entry || scanNo == null ? (
        <View style={styles.centered}>
          <Text style={styles.missing}>{t.entry.notFound}</Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                { top: insets.top + 10 },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="chevron-left" size={18} color={colors.ink} />
            </Pressable>

            <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
              <View style={styles.cardStage}>
                <PigeonCard
                  imageUri={entry.imageUri}
                  scanNo={scanNo}
                  rarity={rarity}
                  flavorIndex={flavorIndex}
                  entryId={entry.id}
                  imageFraming={entry.imageFraming}
                  size="share"
                />
              </View>
            </View>
          </View>

          <ActionFooter style={styles.footerSheet}>
            <View style={styles.statusBlock}>
              <Text style={styles.statusTitle}>{getRarityLabel(rarity, t)}</Text>
              <Text style={styles.statusSubtitle}>{t.entry.title}</Text>
            </View>

            <SocialShareButtons
              shareRef={shareRef}
              scanNo={scanNo}
              disabled={shareBusy || deleting}
              onBusyChange={setSocialBusy}
              layout="icons"
            />

            <FooterButton
              label={t.common.share}
              onPress={handleShare}
              disabled={shareBusy || socialBusy || deleting}
              loading={shareBusy}
            />

            <FooterTextAction
              label={t.common.delete}
              tone="danger"
              onPress={handleDelete}
              disabled={shareBusy || socialBusy}
              loading={deleting}
            />
          </ActionFooter>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missing: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    textAlign: 'center',
  },
  hero: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: borders.thin,
    borderColor: 'rgba(26,26,26,0.08)',
    ...shadow.subtle,
  },
  shareWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cardStage: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    aspectRatio: 5 / 7,
  },
  footerSheet: {
    borderTopWidth: 0,
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
    letterSpacing: 1.2,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
