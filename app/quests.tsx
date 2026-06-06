import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { getPigeonCollection } from '@/services/collectionService';
import { AppIcon } from '@/components/icons/AppIcon';
import { getQuests } from '@/services/questService';
import { colors, spacing } from '@/theme/tokens';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setLoading(true);
      void getPigeonCollection().then((data) => {
        if (!active) return;
        setEntries(data);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const quests = React.useMemo(() => getQuests(entries, t), [entries, t]);
  const completed = quests.filter((q) => q.completed).length;

  return (
    <Screen edges={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.profile.questsTitle} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <Text style={styles.summary}>
            {formatMessage(t.profile.questsSummary, {
              done: completed,
              total: quests.length,
            })}
          </Text>
          {quests.map((quest) => (
            <GlassCard
              key={quest.id}
              style={styles.card}
              highlighted={quest.completed}
            >
              <View style={styles.iconWrap}>
                <AppIcon name={quest.icon} size={26} color={colors.ink} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{quest.title}</Text>
                <Text style={styles.cardDesc}>{quest.description}</Text>
                <Text style={styles.cardFlavor}>{quest.flavor}</Text>
                <Text style={styles.progress}>{quest.progressLabel}</Text>
              </View>
              <Text
                style={[styles.badge, quest.completed ? styles.badgeDone : styles.badgePending]}
              >
                {quest.completed ? t.profile.questDone : t.profile.questPending}
              </Text>
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  cardFlavor: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  progress: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '800' },
  badgeDone: { color: colors.success },
  badgePending: { color: colors.textMuted },
});
