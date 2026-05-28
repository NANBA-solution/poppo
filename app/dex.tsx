import { getPigeonCollection } from '@/services/collectionService';
import { buildDex, getDexCompletion } from '@/services/dexService';
import { getPlayerTitle } from '@/services/titleService';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DexScreen() {
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

  const dex = React.useMemo(() => buildDex(entries), [entries]);
  const completion = getDexCompletion(entries);
  const playerTitle = getPlayerTitle(entries.length);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>ぽっぽ図鑑</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9d6ee" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{playerTitle.title}</Text>
            <Text style={styles.heroSub}>{playerTitle.subtitle}</Text>
            <Text style={styles.heroProgress}>
              図鑑 {completion.discovered}/{completion.goal} 品種（{completion.percent}%）
            </Text>
          </View>

          {dex.length === 0 ? (
            <Text style={styles.empty}>まだ図鑑に登録がありません。ハトをスキャンしよう。</Text>
          ) : (
            dex.map((item) => (
              <View key={item.breed} style={styles.card}>
                <Image source={{ uri: item.sampleImageUri }} style={styles.thumb} />
                <View style={styles.cardBody}>
                  <Text style={styles.breed}>{item.breed}</Text>
                  <Text style={styles.nickname} numberOfLines={2}>
                    {item.latestNickname}
                  </Text>
                  <Text style={styles.meta}>{item.count} 羽 · 初登録</Text>
                </View>
              </View>
            ))
          )}
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
  hero: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(124,184,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.3)',
    gap: 6,
  },
  heroTitle: { color: '#ffd98a', fontSize: 20, fontWeight: '800' },
  heroSub: { color: 'rgba(244,247,250,0.75)', fontSize: 14 },
  heroProgress: { color: '#c9d6ee', fontSize: 13, fontWeight: '700', marginTop: 4 },
  empty: {
    color: 'rgba(244,247,250,0.6)',
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#1a1a22' },
  cardBody: { flex: 1, justifyContent: 'center', gap: 4 },
  breed: { color: '#F4F7FA', fontSize: 16, fontWeight: '800' },
  nickname: { color: 'rgba(244,247,250,0.85)', fontSize: 13, lineHeight: 18 },
  meta: { color: 'rgba(201,214,238,0.55)', fontSize: 12 },
});
