# ぽっぽ（poppo）開発引き継ぎ

最終更新: 2026-05-29（会話サマリー + 直近のクラッシュ/SVG/Supabase 対応）

新チャットでは **このファイルを `@docs/HANDOFF.md` で添付**するか、末尾の「新チャット用プロンプト」を貼ってください。

---

## プロジェクト概要

- **Expo SDK 54** + **expo-router** + **TypeScript**
- **Supabase**: フィード・コレクション同期・匿名/Apple ログイン・いいね・通報
- **ローカルフォールバック**: Supabase 未設定時は AsyncStorage のみ
- **UI**: モダンダーク + バイオレットアクセント（`src/theme/tokens.ts`）
- **i18n**: `src/i18n/locales/ja.ts` / `en.ts`（設定で切替）
- **ルール**: `AGENTS.md` — Expo v54 ドキュメント準拠

---

## 起動・ビルド

**シミュレータで詰まったら必読:** [`docs/IOS_SIMULATOR_START.md`](./IOS_SIMULATOR_START.md)（URL・Metro 二重起動・スプラッシュで止まる等の対処）

```bash
# シミュレータ（日常はこれ）
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npm run build:dev:ios:sim      # ビルド＋起動。Metro は 127.0.0.1:8081
# Metro だけ: npm run start:dev:sim → シミュレータで http://127.0.0.1:8081 をタップ

# 実機
npm run build:dev:ios          # USB 接続の iPhone を選択

# 初回ネイティブ生成（App Store で Xcode が入らないときは `docs/LOCAL_IOS_BUILD.md`）
# 要件: Xcode 16.1 以上（RN 0.81）
npm run prebuild:ios           # 初回のみ（ios/ 生成）
npm run pod:install
# ネイティブを壊したとき
npm run prebuild:ios:clean && npm run pod:install && npm run build:dev:ios:sim
```

- エントリ: `index.js` → `react-native-gesture-handler` → `expo-router/entry`
- EAS projectId: `app.config.js` → `extra.eas.projectId`（`1b5fe20e-c747-49e1-9b2f-ffa8f3cdbb7e`）
- 環境変数: `.env`（**コミットしない**）— `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 等

---

## ルーティング（クラッシュ対策済み）

| パス | 役割 |
|------|------|
| `app/index.tsx` | 起動ゲート → `/onboarding` → `/auth` → `/camera`（**expo-camera を import しない**） |
| `app/camera.tsx` | `CameraScreen` を dynamic import。`isExpoCameraNativeAvailable()` で未同梱時は再ビルド案内 |
| `app/onboarding.tsx` | 初回オンボーディング（3ステップ・シーン別ヒーロー） |
| `app/auth.tsx` | オンボーディング後のログイン/引き継ぎ（匿名 or Apple） |
| `app/feed.tsx` | フィード・いいね・通報・今日のベスト |
| `app/profile.tsx` / `settings.tsx` | プロフィール・設定・Apple ログイン |
| `app/_layout.tsx` | RNGH + I18n + Stack。Supabase セッションは `ensureSupabaseSession`（非ブロッキング） |

カメラ本体: `src/screens/CameraScreen.tsx`

---

## Supabase

### セットアップ手順

`docs/SUPABASE_SETUP.md` 参照。

### マイグレーション（SQL Editor で順に実行）

| ファイル | 内容 |
|----------|------|
| `supabase/schema.sql` | 初回 or フルスキーマ |
| `002_pigeon_scans.sql` | コレクション同期 |
| `003_feed_reports.sql` | 通報 |
| `004_account_migration.sql` | Apple 引き継ぎ RPC |
| `005_feed_likes.sql` | いいね |
| `006_daily_best_and_post_limit.sql` | 1日1投稿・ベストぽっぽ・`upsert_daily_best_poppo` |
| `006b_fix_duplicate_posts.sql` | 006 がインデックスで失敗したときの重複整理 |

**注意（006 実行時）**

- SQL コメントは **`--`（ハイフン2つ）**。Markdown の `-` 1つを貼ると `syntax error at or near "-"` になる
- `006` は `feed_likes` 前提（**005 先**）

### よくある DB エラー

```
Could not find the function public.upsert_daily_best_poppo(...) in the schema cache
```

→ `006` 未適用。上記 SQL を実行後、アプリ Reload。

---

## サービス層（local / remote 分離）

- `src/services/feedService.ts` — ファサード
- `src/services/feedService.local.ts` / `feedService.remote.ts`
- `src/services/collectionService.ts` + `.local` / `.remote`
- `src/services/authService.ts` — 匿名・Apple・プロフィール
- `src/services/reportService.ts`
- `src/lib/supabase.ts`, `src/lib/supabaseConfig.ts`, `src/lib/storageUpload.ts`

---

## ネイティブモジュールと dev client

**JS だけ更新しても足りないもの**（EAS dev build 再ビルドが必要）:

| パッケージ | 用途 | 検出 |
|------------|------|------|
| `expo-camera` | カメラ | `requireOptionalNativeModule('ExpoCamera')` — `src/utils/nativeAvailability.ts` |
| `poppo-icons`（ローカル） | iOS SwiftUI アイコン | `requireOptionalNativeModule('PoppoIcons')` |
| `react-native-svg` | カスタム SVG アイコン（Android / フォールバック） | `UIManager` で `RNSVGSvgView` 等 |
| `expo-av` | 鳩シャッター音 | `ExponentAV` — `src/utils/pigeonSound.ts`（動的 import、無ければ無音） |

### アイコン（`AppIcon`）

- `src/components/icons/AppIcon.tsx` — **iOS**: SwiftUI（`modules/poppo-icons`）→ SVG → Ionicons
- `modules/poppo-icons` — Expo ローカルモジュール（`PoppoIconView` + SwiftUI、`UIHostingController`）
- Android / Web: SVG があれば `AppIconSvg`、なければ `AppIconFallback`
- **ネイティブモジュールを無条件 import すると RCTFatal** — 必ず検出 + lazy require
- SwiftUI / SVG を使う → ローカル `npm run build:dev:ios`（ネイティブ変更後は再ビルド必須）

### その他ネイティブ回避

- `GradientBackground` — `expo-linear-gradient` 不使用（View のみ）
- `pigeonSound.ts` — 起動時に `expo-av` を import しない
- `metro.config.js` — `shims/setUpJsLogger.fx.ts` で古い dev build 向け CodedError シム

---

## 解決済み / 既知の問題

### 解決済み

- `RCTFatal`（起動時）— 起動ルート分離、ネイティブガード、SVG の条件付き読み込み
- カメラ「未同梱」誤表示 — `UIManager` ではなく `requireOptionalNativeModule('ExpoCamera')` で判定
- `expo-av` 起動クラッシュ — 動的 load + `ExponentAV` チェック
- `ExpoLinearGradient` — View フォールバック

### 既知・任意

- Legacy Architecture 警告（`app.json` `newArchEnabled: false`）
- RCTView shadow ADVICE（パフォーマンスヒント、動作には影響小）
- `expo-doctor`: `app.config.js` の `android.queries` スキーマ警告

---

## Git 状態（参考）

多くの変更が **未コミット**（ユーザーは明示的にコミット指示するまで commit しない）。

主な追加/変更領域:

- `app/*`, `src/**`, `supabase/**`, `docs/**`
- `index.js`, `metro.config.js`, `shims/`, `app.config.js`
- `.env` は untracked（コミット禁止）

---

## 新チャット用プロンプト（コピペ用）

```
ぽっぽ（poppo）Expo アプリの開発を続けてください。

@docs/HANDOFF.md @docs/SUPABASE_SETUP.md を読んで現状を把握してください。

直近の状態:
- dev client で起動可能。カメラは expo-camera 同梱ビルドで動作
- iOS: PoppoIcons 同梱ビルドで SwiftUI アイコン。未同梱時は SVG → Ionicons
- react-native-svg 未同梱ビルドでは AppIcon が Ionicons フォールバック（無条件 import は RCTFatal）
- Supabase 006 で upsert_daily_best_poppo / 1日1投稿 / ベストぽっぽ（SQL は -- コメント、005 先行）
- 応答は日本語

次にやりたいこと: （ここに記入）
```

---

## 会話トランスクリプト

詳細ログ: Cursor agent transcript `c42c2709-197a-4151-90ea-c807a1870796`
