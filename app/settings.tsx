import { clearAllCollection } from '@/services/collectionService';
import { resetOnboarding } from '@/services/onboardingService';
import { hapticWarning } from '@/utils/haptics';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clearing, setClearing] = React.useState(false);

  const handleClearCollection = React.useCallback(() => {
    Alert.alert(
      'コレクションをすべて削除',
      '保存したぽっぽと写真がすべて消えます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(true);
              void hapticWarning();
              const count = await clearAllCollection();
              Alert.alert('削除完了', `${count} 件のコレクションを削除しました。`);
            } catch (e) {
              Alert.alert(
                'エラー',
                e instanceof Error ? e.message : '削除に失敗しました。',
              );
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  }, []);

  const handleShowOnboarding = React.useCallback(() => {
    Alert.alert('使い方を再表示', 'オンボーディング画面をもう一度表示しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '表示する',
        onPress: async () => {
          await resetOnboarding();
          router.replace('/onboarding');
        },
      },
    ]);
  }, [router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>設定</Text>
        <View style={styles.backSpacer} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="コレクションをすべて削除"
          disabled={clearing}
          onPress={handleClearCollection}
          style={({ pressed }) => [
            styles.row,
            styles.rowDanger,
            pressed && styles.pressed,
            clearing && styles.disabled,
          ]}
        >
          <Text style={styles.rowLabelDanger}>コレクションをすべて削除</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="使い方を再表示"
          onPress={handleShowOnboarding}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.rowLabel}>使い方を再表示</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>バージョン</Text>
          <Text style={styles.rowValue}>{APP_VERSION}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backLabel: {
    color: '#7CB8FF',
    fontSize: 16,
    fontWeight: '700',
  },
  backSpacer: {
    width: 56,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F7FA',
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  sectionTitle: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rowDanger: {
    borderColor: 'rgba(255,120,120,0.25)',
    backgroundColor: 'rgba(255,80,80,0.06)',
  },
  rowLabel: {
    color: '#F4F7FA',
    fontSize: 16,
    fontWeight: '600',
  },
  rowLabelDanger: {
    color: '#ffb4b4',
    fontSize: 16,
    fontWeight: '700',
  },
  rowValue: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 15,
  },
  chevron: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 22,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
});
