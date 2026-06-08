# GitHub Actions で TestFlight に上げる（ぽっぽ / poppo）

**2026年4月時点** — App Store 提出には **iOS 26 SDK（Xcode 26 以上）** が必要です。  
ローカル Mac に Xcode 26 が入らない場合、GitHub の **`macos-26`** ランナーで prebuild → Archive → アップロードします。

## 1. Apple Developer（初回のみ）

1. [developer.apple.com](https://developer.apple.com) — Developer Program 加入
2. **Identifiers** → App ID `app.poppo.mobile` を作成
3. Team ID をメモ（例: `54YGGGZ8F6`）

## 2. App Store Connect API キー（初回のみ）

1. [App Store Connect](https://appstoreconnect.apple.com) → **ユーザとアクセス** → **統合** → **App Store Connect API**
2. **＋** でキー作成
   - 名前: `GitHub Actions`
   - ロール: **Admin**（App マネージャーだと Export が失敗する）
3. **Issuer ID** / **キー ID** / `.p8` を保存

```bash
# .p8 → base64（画面に出さずクリップボードへ）
base64 -i ~/Downloads/AuthKey_あなたのキーID.p8 | tr -d '\n' | pbcopy
```

## 3. GitHub Secrets

リポジトリ `NANBA-solution/poppo` → **Settings** → **Secrets and variables** → **Actions**

セイケツと同じ Apple チーム・同じ API キーを流用する場合:

| Secret | 値 |
|--------|-----|
| `APPSTORE_ISSUER_ID` | `83e1ba8c-9d21-46a4-8341-5db874165434` |
| `APPSTORE_API_KEY_ID` | `7HZ2G9DHBY` |
| `DEVELOPMENT_TEAM` | `54YGGGZ8F6` |
| `APPSTORE_API_PRIVATE_KEY` | **ターミナルで生成**（下記）。MD・Git・チャットに値を書かない |

### 秘密鍵（4つ目）— `APPSTORE_API_PRIVATE_KEY`

| 項目 | 内容 |
|------|------|
| ロール | **Admin** |
| キー名（Connect） | `GitHub Actions` |
| キー ID | `7HZ2G9DHBY`（ファイル名: `AuthKey_7HZ2G9DHBY.p8`） |
| ローカル `.p8` | `~/Downloads/AuthKey_7HZ2G9DHBY.p8` |

```bash
# リポジトリ直下で実行 → クリップボードに base64 1行（画面には出さない）
bash ci/copy-appstore-api-key.sh
# → GitHub Secret `APPSTORE_API_PRIVATE_KEY` に Cmd+V
```

別の `.p8` を使う場合:

```bash
APPSTORE_API_P8_PATH=~/Downloads/AuthKey_XXXX.p8 bash ci/copy-appstore-api-key.sh
```

**⚠️ base64 の値だけは Git・チャットに貼らない。**

## 4. push で CI が走る

`main` へ push し、次のいずれかが変わったとき:

- `app/`, `src/`, `assets/`, `modules/`
- `app.json`, `app.config.js`, `package.json`
- `.github/workflows/ios-testflight.yml`, `ci/**`

## 5. 手動実行

GitHub → **Actions** → **iOS TestFlight Upload** → **Run workflow** → branch `main`

## 6. Connect で確認

1. **TestFlight** → ぽっぽ
2. ビルド **1.0.0 (run番号)** の **Processing** 完了を待つ（5〜30分）
3. App Store 提出時: バージョンにビルドを紐付け → **審査用に追加**

## バージョン運用

| 種類 | 場所 | いつ変える |
|------|------|------------|
| マーケティングバージョン | `app.json` の `expo.version` | ストアに新バージョンとして出すとき |
| ビルド番号 | CI が `github.run_number` で自動設定 | push のたびに増加 |

## 日常フロー

```
ローカル開発 → commit → push main
  → Actions 成功
  → Connect TestFlight で Processing
  → ビルド選択 → 審査用に追加
```

## トラブルシュート

| エラー | 対処 |
|--------|------|
| Secret 未設定 | 4 つの Secret を再確認 |
| Cloud signing permission error | API キーを **Admin** に |
| `no such module` / Archive exit 65 | `.xcworkspace` で Archive（workflow は対応済み） |
| 90062 バージョンエラー | `app.json` の `version` を承認済みより大きく |
| push しても CI が走らない | `paths` 外の変更のみ → **Run workflow** |

## 参考

- ワークフロー: `.github/workflows/ios-testflight.yml`
- Export 設定: `ci/ExportOptions.plist`
- セイケツ実装: https://github.com/NANBA-solution/seiketu
