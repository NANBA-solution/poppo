# ぽっぽ（POPPO）製品要件定義書（PRD）

| 項目 | 内容 |
|------|------|
| 製品名 | ぽっぽ（POPPO） |
| バージョン | 1.0.0 |
| 最終更新 | 2026-06-06 |
| プラットフォーム | iOS / Android（Expo dev client 前提） |
| ドキュメント種別 | 現行実装に基づく PRD |

---

## 1. プロダクト概要

### 1.1 一言で

街のハトを撮影してコレクションする、シュールでワクワクするローカル専用ハトスキャンアプリ。

### 1.2 ビジョン

「品種図鑑」ではなく **スキャン数とコレクション体験** を中心に、ハトとの出会いを記録・共有・継続させる。達成報酬のない理不尽クエストと毎日の鳩通知で、意味は薄いが愛おしい習慣をつくる。

### 1.3 コアバリュー

- **即時判定**: ネット不要。端末内 ML Kit でハトかどうかをその場で判定
- **ローカル完結**: 写真・データは端末内のみ。ログイン・クラウド同期不要
- **第 N 羽**: 品種ではなく通し番号でコレクションを愛でる
- **シュールな遊び心**: クエスト・称号・通知文言が理不尽で面白い

### 1.4 ターゲットユーザー

- 街でハトを見かけたときに「なんか撮りたい」と思う人
- コレクションアプリ・図鑑アプリが好きな人
- SNS に変わった写真をシェアしたい人（Instagram ストーリー / X）

### 1.5 非ターゲット（意図的に提供しない）

- 品種名・学術的分類を求めるバードウォッチャー
- マルチデバイス同期・ソーシャルフィード・いいね機能を求めるユーザー

---

## 2. スコープ

### 2.1 含む（In Scope）

| 領域 | 内容 |
|------|------|
| カメラ撮影 | 実機カメラ、シミュレータでは写真ピッカー |
| ハト判定 | ML Kit 画像ラベリング（端末内） |
| コレクション | ローカル保存、一覧、詳細、削除 |
| プロフィール | 統計、称号、スキャン一覧 |
| クエスト | 64 種類の達成条件（報酬なし） |
| シェア | 画像キャプチャ + 共有シート / Instagram / X |
| オンボーディング | 初回 3 ステップチュートリアル |
| 設定 | 言語切替、データ全削除、オンボ再表示 |
| 通知 | 毎日 10:00 ローカル通知（設定 UI なし） |
| 多言語 | 日本語 / English |
| フィードバック | 鳩の鳴き声（シャッター・タブ・成功時）、ハプティクス |

### 2.2 含まない（Out of Scope / 廃止済み）

- クラウド AI 品種判定（Vercel API は削除済み）
- Supabase 同期・匿名 / Apple ログイン（`auth` 画面はリダイレクトのみ）
- フィード・いいね・通報・今日のベスト
- 品種別図鑑 UI
- 通知のオンオフ設定 UI（機能自体は常時有効）
- Web 版フル機能（カメラ・ML Kit・通知は非対応）

---

## 3. ユーザーフロー

### 3.1 初回起動

```
起動 → index（ゲート）
  ├─ オンボ未完了 → /onboarding（3 ステップ）
  │     └─ 完了 or スキップ → /camera
  └─ オンボ完了済み → /camera
```

### 3.2 スキャンフロー（メインループ）

```
/camera
  → シャッター（鳩 MP3 + ハプティクス）
  → /result?uri=...
       ├─ loading: ML Kit でハト判定 + ScanDetectOverlay 演出
       ├─ success: ローカル保存（breed=「未判定」）→ 第 N 羽表示
       │     ├─ 詳細へ /entry/[id]
       │     └─ シェア（画像 + キャプション「第{n}羽をゲット！」）
       ├─ error（非ハト）: NotPigeonError → 撮り直し案内
       └─ error（その他）: 再確認ボタン
```

### 3.3 ナビゲーション

カメラ画面下部・プロフィールから遷移可能。

| 遷移先 | パス | 説明 |
|--------|------|------|
| マイぽっぽ | `/profile` | 統計・称号・スキャン一覧 |
| コレクション | `/collection` | 第 N 羽一覧（旧 `/dex` はリダイレクト） |
| クエスト | `/quests` | 全クエスト進捗 |
| 設定 | `/settings` | 言語・削除・オンボ再表示 |
| 詳細 | `/entry/[id]` | 1 羽の詳細・シェア・削除 |

タブ相当の遷移（FloatingPill 等）では **鳩の鳴き声** が鳴る（`useTabRouter`）。

---

## 4. 機能要件

### 4.1 カメラ（`CameraScreen`）

| 要件 ID | 説明 |
|---------|------|
| CAM-01 | `expo-camera` によるリアルタイムプレビュー（縦向き） |
| CAM-02 | カメラ許可が未付与の場合は許可 UI を表示 |
| CAM-03 | フラッシュ OFF / ON / AUTO 切替 |
| CAM-04 | ピンチズーム |
| CAM-05 | タップフォーカス |
| CAM-06 | シャッター押下で `playPigeonShutter()`（iOS システム音は別途鳴る場合あり） |
| CAM-07 | コレクション件数バッジ（マイぽっぽボタン、99+ 表示） |
| CAM-08 | シミュレータではプレビュー非表示 + 写真ピッカーで代替 |
| CAM-09 | 撮影成功後 `/result` へ URI を渡して遷移 |

### 4.2 ハト判定（`pigeonDetectService`）

| 要件 ID | 説明 |
|---------|------|
| DET-01 | `@react-native-ml-kit/image-labeling` で端末内ラベリング |
| DET-02 | ハト関連キーワード（pigeon, dove, ハト, 鳩 等）でスコアリング |
| DET-03 | 鳥全般ラベル + 閾値による補助判定 |
| DET-04 | 猫・犬・人など非ハトラベルでブロック |
| DET-05 | 閾値: ハト直接 `MIN_PIGEON_CONFIDENCE=0.48`、鳥補助 `MIN_BIRD_CONFIDENCE=0.62` |
| DET-06 | 非ハト時は `NotPigeonError` を throw |
| DET-07 | Web / ML Kit 未リンク時はモジュール null → エラー扱い |
| DET-08 | **品種判定は行わない**。保存時 `breed` は常に「未判定」 |

### 4.3 コレクション保存

| 要件 ID | 説明 |
|---------|------|
| COL-01 | AsyncStorage キー: `@poppo/collection/v1` |
| COL-02 | 画像は `documentDirectory/poppo-scans/` にコピー（カメラロール・クラウドには保存しない） |
| COL-03 | エントリは新しい順で先頭追加 |
| COL-04 | 削除時はストレージ上の画像ファイルも削除 |
| COL-05 | 全削除（設定から）でコレクション + 画像を一括削除 |

**データモデル `PigeonEntry`**

```typescript
{
  id: string;          // タイムスタンプ + ランダム
  imageUri: string;    // アプリ内永続パス
  breed: string;       // 常に「未判定」（スキーマ互換のため残存）
  scannedAt: string;   // ISO 8601
}
```

**スキャン通し番号**

- 新しい順ソート済みリストにおける `entries.length - index` = 第 N 羽
- UI・シェア・クエスト進捗の表示に使用

### 4.4 結果画面（`/result`）

| 要件 ID | 説明 |
|---------|------|
| RES-01 | 判定中は `ShareCaptureFrame` + `ScanDetectOverlay`（POPPO DETECT 演出） |
| RES-02 | 成功時カードに「第 N 羽」+「コレクションに保存しました」 |
| RES-03 | 成功時 `hapticSuccess()` + 鳩音 |
| RES-04 | 非ハト時は専用タイトル・本文でエラー表示 |
| RES-05 | シェア: `react-native-view-shot` でフレームを JPG キャプチャ |
| RES-06 | SNS ボタン: Instagram ストーリー / X（キャプションはクリップボードコピー併用） |

### 4.5 プロフィール（`/profile`）

| 要件 ID | 説明 |
|---------|------|
| PRO-01 | ブランドアイコン + 称号（`titleService`）+ 次の称号までの残り羽数 |
| PRO-02 | 統計チップ: 総スキャン / 目標 100 羽 / 達成率 % |
| PRO-03 | クイックナビ: コレクション・クエスト |
| PRO-04 | スキャン一覧: 「第 N 羽」+ 日時、新しい順 / 古い順ソート |
| PRO-05 | 空状態時はカメラへ誘導 CTA |
| PRO-06 | 設定ボタン → `/settings` |

### 4.6 コレクション（`/collection`）

| 要件 ID | 説明 |
|---------|------|
| DEX-01 | 称号 + 進捗 `{current}/{goal} 羽スキャン（{percent}%）` |
| DEX-02 | 第 N 羽カード一覧（画像・番号・日時） |
| DEX-03 | タップで `/entry/[id]` |

**進捗計算（`getDexCompletion`）**

- `goal` デフォルト: **100 羽**
- `percent` = min(100, round(current / goal * 100))

### 4.7 詳細（`/entry/[id]`）

| 要件 ID | 説明 |
|---------|------|
| ENT-01 | シェア用フレーム（minimal モード）に第 N 羽 + 撮影日時 |
| ENT-02 | 画像シェア / Instagram / X |
| ENT-03 | コレクションから削除（確認ダイアログ） |

### 4.8 クエスト（`/quests`）

| 要件 ID | 説明 |
|---------|------|
| QST-01 | 全 **64** クエスト。達成状態はコレクションから毎回算出（永続化なし） |
| QST-02 | 報酬・ポイント・通知なし（理不尽クエスト帳） |
| QST-03 | 各クエスト: タイトル・説明・flavor・進捗 `{current}/{max}` |
| QST-04 | スキャン成功時に新規達成があれば `result` でトースト表示可 |

**クエストカテゴリ（実装ロジック）**

| カテゴリ | 例 |
|----------|-----|
| スキャン数 | `first_scan`, `scan_3` … `scan_999` |
| 日数・連続 | `breeds_3/10/30`（別日スキャン）, `week_streak_7`, `monoculture_10` |
| 同日・時間帯 | `same_day_5`, `rainbow_day`（同日5時間帯）, `breed_chaos_7`（同日7羽） |
| 時刻指定 | `dawn_444`, `hour_333`, `exact_second_444` 等 |
| 曜日・日付 | `tuesday_3`, `friday_13th`, `jan_1` 等 |
| 速度 | `breed_clone_5`（5分以内5羽）, `flash_10sec_3`, `hour_rush_10` |
| 純血・儀式 | `sunday_purist`, `pending_purist_10`（全件0分）, `pending_5`（:05に5回） |
| 達成不能（意図的） | `phantom_breed`, `schrodinger_poppo` |

### 4.9 称号（`titleService`）

| 要件 ID | 説明 |
|---------|------|
| TTL-01 | スキャン数しきい値に応じて **31 段階** の称号 |
| TTL-02 | しきい値: 0, 1, 2, 3, 5, 7, 10, … 999 |
| TTL-03 | 各称号に `title` + `subtitle`（シュールな文言） |
| TTL-04 | 次の称号までの残り羽数を表示（最大称号除く） |

### 4.10 オンボーディング

| 要件 ID | 説明 |
|---------|------|
| ONB-01 | 3 ステップ: SCAN → DETECT → COLLECT |
| ONB-02 | 各ステップに v3 イラスト（`onboarding-v3-*.png`） |
| ONB-03 | スキップ・言語切替（コンパクト）可能 |
| ONB-04 | 完了フラグは `onboardingService`（AsyncStorage） |
| ONB-05 | 設定から「使い方を再表示」でリセット可能 |

### 4.11 設定

| 要件 ID | 説明 |
|---------|------|
| SET-01 | コレクション全削除（確認 2 段階） |
| SET-02 | 言語: 日本語 / English（`LanguagePills`） |
| SET-03 | オンボーディング再表示 |
| SET-04 | アプリバージョン表示 |

### 4.12 毎日通知

| 要件 ID | 説明 |
|---------|------|
| NTF-01 | `expo-notifications` ローカルスケジュール |
| NTF-02 | 毎日 **10:00**、14 日先まで事前スケジュール |
| NTF-03 | 文言プール: 日本語 **21** 件 / English **21** 件（日付ローテ） |
| NTF-04 | 起動・フォアグラウンド復帰・言語変更時に `refreshDailyNotifications` |
| NTF-05 | タップでアプリ起動（`registerDailyNotificationResponse`） |
| NTF-06 | **ユーザー向けオンオフ UI なし**（常時有効） |
| NTF-07 | Web では無効 |

### 4.13 シェア

| 要件 ID | 説明 |
|---------|------|
| SHR-01 | キャプション: `第{n}羽をゲット！` / `Got scan #{n}!` + ハッシュタグ |
| SHR-02 | 共有時にキャプションをクリップボードへ自動コピー（Web 除く） |
| SHR-03 | Instagram: ストーリー投稿（Facebook App ID 設定時はネイティブ連携） |
| SHR-04 | X: ネイティブ共有 or 共有シート or intent |
| SHR-05 | iOS `LSApplicationQueriesSchemes` に instagram / x 登録済み |

### 4.14 音・触覚

| 要件 ID | 説明 |
|---------|------|
| SND-01 | `assets/sounds/pigeon-coo.mp3` |
| SND-02 | シャッター・タブ遷移・判定成功/警告で再生 |
| HAP-01 | `expo-haptics` による light / success / warning |

---

## 5. UI / デザイン

### 5.1 デザインコンセプト

クリーム（`#F5F1EA`）× 黒（`#1A1A1A`）のライト UI。カメラ画面のみダーク（`#111111`）。

### 5.2 デザイントークン（`src/theme/tokens.ts`）

- 背景: `colors.bg`, `colors.paper`
- サーフェス: `colors.surfaceSolid`, `GlassCard`
- テキスト: `colors.text`, `colors.textMuted`
- アクセント: `colors.accent`（実質ブラック）
- 角丸: `radii.sm` 12 / `md` 16 / `lg` 20 / `pill` 999

### 5.3 主要コンポーネント

| コンポーネント | 用途 |
|----------------|------|
| `Screen` / `ScreenHeader` | 画面骨格 |
| `GlassCard` | カード UI |
| `FloatingPill` | カメラ下部ナビ |
| `ActionFooter` / `FooterButton` | 結果・詳細のフッター |
| `ScanDetectOverlay` | 判定中 HUD 演出 |
| `ShareCaptureFrame` | シェア画像フレーム |
| `ScanResultCard` | 成功/エラーカード |
| `SocialShareButtons` | Instagram / X |
| `AppIcon` | iOS SwiftUI → SVG → Ionicons フォールバック |

### 5.4 アイコン・アセット

- アプリアイコン: `assets/brand-icon.png`
- スプラッシュ: `assets/splash-icon.png`（背景 `#F5F1EA`）
- オンボーディング: `assets/onboarding/onboarding-v3-{scan,detect,collection}.png`

---

## 6. 技術要件

### 6.1 スタック

| 層 | 技術 |
|----|------|
| フレームワーク | Expo SDK 54, React Native 0.81 |
| ルーティング | expo-router（Stack） |
| 言語 | TypeScript |
| 状態 | React hooks + ローカル AsyncStorage |
| カメラ | expo-camera |
| 判定 | @react-native-ml-kit/image-labeling |
| 通知 | expo-notifications |
| 音 | expo-av（動的 import） |
| シェア | expo-sharing, react-native-view-shot, expo-media-library |

### 6.2 バンドル ID

- iOS: `app.poppo.mobile`
- Android: `app.poppo.mobile`
- URL Scheme: `poppo://`

### 6.3 ネイティブ再ビルドが必要な変更

以下を変更・追加した場合は dev client の再ビルドが必須。

- expo-camera / expo-notifications / ML Kit / expo-av
- `app.config.js` の plugins 変更
- ネイティブモジュール（`poppo-icons` 等）

### 6.4 パーミッション

| 権限 | 用途 |
|------|------|
| カメラ | ハト撮影 |
| 写真ライブラリ | シミュレータ写真選択・Instagram フォールバック保存 |
| 通知 | 毎日リマインド |

---

## 7. 多言語（i18n）

| 項目 | 内容 |
|------|------|
| 対応言語 | 日本語（デフォルト）, English |
| 辞書 | `src/i18n/locales/ja.ts`, `en.ts` |
| 切替 | 設定画面 `LanguagePills`、オンボでもコンパクト切替 |
| 形式 | `formatMessage` による `{n}`, `{current}` 等の補間 |

---

## 8. エラー・境界条件

| 状況 | 挙動 |
|------|------|
| カメラ未許可 | 許可ボタン表示 |
| カメラ未同梱ビルド | 再ビルド案内（`camera.tsx` ガード） |
| ML Kit 未利用 | 判定失敗 → 再確認 |
| 非ハト画像 | `notPigeonTitle` / `notPigeonBody`、保存しない |
| シェアキャンセル | エラーにしない |
| コレクション 0 件 | 各画面で empty state + CTA |
| `/auth` アクセス | `/camera` へリダイレクト |
| `/dex` アクセス | `/collection` へリダイレクト |

---

## 9. 成功指標（提案）

製品として追うなら以下を想定（現状未実装の分析基盤）。

| KPI | 説明 |
|-----|------|
| D1 スキャン率 | 初回起動から 24h 以内に 1 羽以上 |
| 7 日リテンション | 7 日以内に再スキャン |
| 平均スキャン数 | 累計スキャン / アクティブユーザー |
| シェア率 | スキャン成功のうちシェア実行割合 |
| クエスト達成数分布 | どのクエストが人気か |

---

## 10. 既知の制約・仕様として許容する挙動

- iOS ではシステムシャッター音と鳩 MP3 が二重に鳴る場合がある
- 品種フィールドはデータ上残るが UI には出さない
- `phantom_breed` / `schrodinger_poppo` は達成不能（仕様）
- 称号 tier（最大 999 羽）とコレクション目標（100 羽）は別体系
- `@supabase/supabase-js` は package に残るがアプリから未使用

---

## 11. 将来検討（バックログ）

優先度未定。PRD スコープ外。

- 通知オンオフ設定
- 品種判定の復活（オプトイン）
- iCloud / 手動バックアップ
- Android 実機 QA 強化
- TestFlight / ストア公開フロー整備

---

## 12. 用語集

| 用語 | 定義 |
|------|------|
| ぽっぽ / POPPO | スキャンしてコレクションした 1 羽のハト |
| 第 N 羽 | スキャン通し番号（新しい順リスト上の逆順インデックス） |
| スキャン | 撮影 → ハト判定 → 保存までの一連の操作 |
| コレクション | 保存済みぽっぽの一覧（旧称「図鑑」「dex」） |
| 未判定 | 品種不明の固定ラベル（`breed` フィールド値） |
| 理不尽クエスト | 達成しても報酬がないクエスト群 |

---

## 13. 関連ドキュメント

- 開発引き継ぎ: `docs/HANDOFF.md`
- iOS シミュレータ起動: `docs/IOS_SIMULATOR_START.md`
- 旧企画書（V5・アバター版）: `docs/archive/【企画書】世界のハト写真コレクションアプリ『ぽっぽ（POPPO）』V5_アバター機能追加版.md`
- Expo バージョンルール: `AGENTS.md`

---

## 改訂履歴

| 日付 | 版 | 内容 |
|------|-----|------|
| 2026-06-06 | 1.0 | 現行実装（ローカル専用・スキャン中心）に基づき初版作成 |
