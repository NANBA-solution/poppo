# ぽっぽ（poppo）開発引き継ぎ

最終更新: 2026-06-06

新チャットでは **このファイルを `@docs/HANDOFF.md` で添付**するか、末尾の「新チャット用プロンプト」を貼ってください。

---

## プロジェクト概要

- **Expo SDK 54** + **expo-router** + **TypeScript**
- **保存**: ローカル専用（AsyncStorage + アプリ内画像コピー）。クラウド同期・ログイン・フィードは廃止
- **鳩判定**: 端末内 ML Kit（`pigeonDetectService.ts`）。品種は常に「未判定」固定
- **UI**: クリーム × 黒（`src/theme/tokens.ts`）
- **i18n**: `src/i18n/locales/ja.ts` / `en.ts`（設定で切替）
- **通知**: 毎日10:00ローカル通知（`DailyNotificationBootstrap`、設定 UI なし）
- **音**: `assets/sounds/pigeon-coo.mp3`（シャッター・タブ・判定成功）
- **ルール**: `AGENTS.md` — Expo v54 ドキュメント準拠

---

## 起動・ビルド

**シミュレータで詰まったら必読:** [`docs/IOS_SIMULATOR_START.md`](./IOS_SIMULATOR_START.md)

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

npm run build:dev:ios:sim      # シミュレータ
npm run build:dev:ios:device   # 実機（通知・ML Kit 等は再ビルド必須）
npm run start:dev:sim          # Metro のみ
```

- エントリ: `index.js` → `react-native-gesture-handler` → `expo-router/entry`
- EAS projectId: `app.config.js` → `extra.eas.projectId`

---

## ルーティング

| パス | 役割 |
|------|------|
| `app/index.tsx` | 起動ゲート → `/onboarding` or `/camera` |
| `app/onboarding.tsx` | 初回オンボーディング（3ステップ） |
| `app/camera.tsx` | `CameraScreen`（dynamic import） |
| `app/result.tsx` | スキャン結果・保存・シェア |
| `app/collection.tsx` | コレクション一覧（第 N 羽） |
| `app/dex.tsx` | `/collection` へリダイレクト（旧ルート互換） |
| `app/profile.tsx` | マイぽっぽ・統計・一覧 |
| `app/quests.tsx` | クエスト一覧 |
| `app/entry/[id].tsx` | 詳細・シェア |
| `app/settings.tsx` | データ削除・言語・オンボ再表示 |
| `app/auth.tsx` | `/camera` へリダイレクト（ログイン廃止） |
| `app/_layout.tsx` | RNGH + I18n + 毎日通知ブートストラップ |

---

## サービス層

| ファイル | 役割 |
|----------|------|
| `collectionService.ts` / `.local.ts` | コレクション CRUD（ローカルのみ） |
| `pigeonDetectService.ts` | ML Kit によるハト判定 |
| `dexService.ts` | `getDexCompletion`（目標100羽） |
| `questService.ts` | クエスト進捗（`types/quest.ts`） |
| `titleService.ts` | スキャン数ベースの称号 |
| `dailyNotificationService.ts` | ローカル通知スケジュール |

---

## ネイティブ再ビルドが必要なもの

| パッケージ | 用途 |
|------------|------|
| `expo-camera` | カメラ |
| `expo-notifications` | 毎日通知 |
| ML Kit ラベリング | ハト判定 |
| `expo-av` | 鳩シャッター音 |

---

## 設計メモ

- **スキャン中心**: UI・クエスト・シェアは「第 N 羽」表記。品種クエストは日数・時間帯ベースに差し替え済み
- **シェア**: `ShareCaptureFrame` + `SocialShareButtons`（Instagram / X）
- **達成不能クエスト**: `phantom_breed`（品種判定廃止の名残）、`schrodinger_poppo`（意図的）

---

## 新チャット用プロンプト

```
ぽっぽ（poppo）Expo アプリの開発を続けてください。
@docs/HANDOFF.md を読んで現状を把握してください。
- ローカル保存・端末内 ML Kit 判定・スキャン数中心 UI
- 応答は日本語
次にやりたいこと: （ここに記入）
```
