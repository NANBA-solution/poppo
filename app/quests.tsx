import { getPigeonCollection } from '@/services/collectionService';
import { getQuests } from '@/services/questService';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const quests = React.useMemo(() => getQuests(entries), [entries]);
  const completed = quests.filter((q) => q.completed).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>ぽっぽクエスト</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9d6ee" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <Text style={styles.summary}>
            達成 {completed}/{quests.length}
          </Text>
          {quests.map((quest) => (
            <View
              key={quest.id}
              style={[styles.card, quest.completed && styles.cardDone]}
            >
              <Text style={styles.emoji}>{quest.emoji}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{quest.title}</Text>
                <Text style={styles.cardDesc}>{quest.description}</Text>
                <Text style={styles.progress}>{quest.progress(entries)}</Text>
              </View>
              <Text style={styles.badge}>{quest.completed ? '達成' : '未達成'}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { minWidth: 72 },
  backLabel: { color: '#7CB8FF', fontSize: 16, fontWeight: '700' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F7FA',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: { minWidth: 72 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: {
    color: 'rgba(201,214,238,0.7)',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardDone: {
    borderColor: 'rgba(255,217,138,0.5)',
    backgroundColor: 'rgba(255,217,138,0.08)',
  },
  emoji: { fontSize: 28 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: '#F4F7FA', fontSize: 16, fontWeight: '800' },
  cardDesc: { color: 'rgba(244,247,250,0.7)', fontSize: 13, lineHeight: 18 },
  progress: { color: 'rgba(201,214,238,0.55)', fontSize: 12, fontWeight: '700' },
  badge: { color: '#ffd98a', fontSize: 12, fontWeight: '800' },
});
