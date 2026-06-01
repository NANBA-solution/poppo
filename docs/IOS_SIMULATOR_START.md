# iOS シミュレータ起動ガイド（ぽっぽ dev client）

**同じ轍を踏まないための決定版。** シミュレータで開発するときはこのファイルだけ見ればよい。

---

## 結論（これだけ覚える）

| やりたいこと | コマンド |
|--------------|----------|
| **シミュレータにアプリを出す**（ビルド＋インストール＋Metro） | `npm run build:dev:ios:sim` |
| すでにビルド済みで **Metro だけ** 起動 | `npm run start:dev:sim` |
| 接続 URL（手入力するとき） | **`http://127.0.0.1:8081`** |

**やってはいけないこと**

- `npm run start:dev:sim` **だけ** → Metro は立つが **シミュレータにアプリは出ない**
- `npm run build:dev:ios` でシミュレータ選択 → **LAN IP（10.x）** で繋ごうとして **スプラッシュや dev client で止まる**
- `xcrun simctl launch booted app.poppo.mobile` → この Mac では **極端に遅い／ハング** しやすい
- Metro を **8081 と 8082 で二重起動** → dev client の `localhost:8081` が **灰色のまま**

---

## 正しい起動フロー（毎日）

### 1. 初回 or ネイティブを変えたあと

```bash
cd /Users/apple/poppo
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npm run build:dev:ios:sim
```

- 端末は **iPhone 15 Pro (17.5)** 固定（Xcode 18.2 SDK と iOS 18.3 シミュレータは不一致でビルド失敗しやすい）
- ビルド **10〜15 分**（初回のみ）
- 末尾で `simctl openurl` が **code 60 で失敗** しても **よくある** → 手順 2 へ

### 2. Metro を繋ぐ（自動起動に失敗したとき）

ターミナルで Metro が止まっていたら:

```bash
npm run start:dev:sim
```

シミュレータの **ぽっぽ（Development Build）** で:

1. **`http://127.0.0.1:8081`** をタップ（緑の点が付いている行）
2. 出ないときは **Enter URL manually** → `http://127.0.0.1:8081`
3. **初回だけ** JS バンドル **1〜2 分**（ターミナルに `iOS Bundled`）
4. 真っ黒・白グリッドのまま → Simulator で **⌘R**

**使わない URL:** `http://10.41.209.x:8081` / `http://172.20.10.x:8081`（実機・LAN 用。シミュレータでは繋がらない）

### 3. 2 回目以降（コードだけ変えた）

```bash
npm run start:dev:sim
```

→ シミュレータでアプリを開き **`127.0.0.1:8081`** をタップ → **数秒〜30 秒**

---

## 症状 → 原因 → 対処

| 画面・症状 | 原因 | 対処 |
|------------|------|------|
| dev client **No development servers found** | Metro が止まっている / 別ポート | `npm run start:dev:sim`、**8081 だけ** |
| **白背景＋グリッド＋同心円**（スプラッシュ） | JS 未読込（Metro 未接続 or 間違い URL） | `127.0.0.1:8081`、⌘R |
| **Downloading 100%…** で止まる | LAN IP からバンドル取得失敗 | 手入力で `http://127.0.0.1:8081` |
| **準備中…**（カメラ画面） | シミュレータにカメラなし | **写真を選ぶ** or **実機** |
| ターミナル `openurl` **code 60** | `simctl` タイムアウト（自動起動失敗） | **無視してよい**。手動で URL 接続 |
| `xcodebuild` **error 70** | iOS 18.3 シム + Xcode 18.2 SDK 不一致 | **iOS 17.5** の iPhone 15 Pro を使う |
| 何分待っても dev client だけ | `start:dev:sim` のみ実行 | `build:dev:ios:sim` または URL 手動接続 |

---

## npm スクリプト一覧

| スクリプト | 用途 |
|------------|------|
| `npm run build:dev:ios:sim` | シミュレータ向け **ビルド＋起動**（`127.0.0.1` 固定） |
| `npm run open:ios:sim` | 上と同系（デバイス ID 固定） |
| `npm run start:dev:sim` | Metro のみ（`--localhost`） |
| `npm run build:dev:ios` | **実機**向け（`--device`、シミュレータでは非推奨） |

---

## 技術メモ（なぜこうなるか）

1. **dev client** はネイティブの殻。中身（JS）は **Metro（8081）** から毎回読む。
2. シミュレータの `localhost` = Mac 自身 → **`127.0.0.1:8081` が正解**。
3. `expo run:ios` は自動で `exp+poppo://...?url=http://10.x...` を開こうとすることがある → シミュレータでは失敗しやすい。
4. `ios/.xcode.env.local` に `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1` を設定済み（ネイティブビルド用）。
5. スプラッシュ画像（`assets/splash-icon.png`）がグリッド＋円。**JS が載ると暗い UI に切り替わる**。

---

## カメラを試すとき

- **シミュレータ:** プレビュー不可。UI 確認・**写真を選ぶ**・フィード等は可。
- **実機:** `npm run build:dev:ios`（USB 接続の iPhone を選択）。

---

## 関連ドキュメント

- [LOCAL_IOS_BUILD.md](./LOCAL_IOS_BUILD.md) — Xcode 16.2 の入れ方・初回ネイティブビルド
- [HANDOFF.md](./HANDOFF.md) — プロジェクト全体の引き継ぎ
