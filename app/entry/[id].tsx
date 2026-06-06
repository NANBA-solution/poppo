import { ShareCaptureFrame } from '@/components/ShareCaptureFrame';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { ActionFooter, FooterButton } from '@/components/ui/ActionFooter';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import {
  deletePigeonScan,
  getPigeonById,
  getPigeonCollection,
  getScanNumber,
} from '@/services/collectionService';
import type { PigeonEntry } from '@/types/collection';
import { colors } from '@/theme/tokens';
import { formatDateTime } from '@/utils/formatDate';
import { sharePigeonImageWithFallback } from '@/utils/sharePigeon';
import { useTabRouter } from '@/hooks/useTabRouter';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
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

  return (
    <Screen edges={false} pigeons={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.entry.title} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !entry ? (
        <View style={styles.centered}>
          <Text style={styles.missing}>{t.entry.notFound}</Text>
        </View>
      ) : (
        <>
          <View style={styles.stage}>
            <View ref={shareRef} style={styles.shareWrap} collapsable={false}>
              <ShareCaptureFrame
                imageUri={entry.imageUri}
                phase="success"
                headline={
                  scanNo != null
                    ? formatMessage(t.profile.scanEntry, { n: scanNo })
                    : undefined
                }
                subtitle={formatDateTime(entry.scannedAt, locale)}
                minimal
              />
            </View>
          </View>

          <ActionFooter>
            {scanNo != null ? (
              <SocialShareButtons
                shareRef={shareRef}
                scanNo={scanNo}
                disabled={shareBusy || deleting}
                onBusyChange={setSocialBusy}
              />
            ) : null}
            <View style={styles.footerRow}>
              <FooterButton
                label={t.common.share}
                onPress={handleShare}
                disabled={shareBusy || socialBusy || deleting}
                loading={shareBusy}
              />
              <FooterButton
                label={t.common.delete}
                variant="danger"
                flex={0}
                onPress={handleDelete}
                disabled={deleting || shareBusy}
                loading={deleting}
              />
            </View>
          </ActionFooter>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missing: {
    color: colors.textMuted,
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
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
