# iOS ローカルビルド（Xcode が App Store で入らないとき）

## なぜ App Store でダウンロードできないか

- この Mac: **macOS 14.8（Sonoma）** + **Xcode 15.4**
- App Store の「Xcode」は **最新版のみ**（macOS 15.3 以降が必要なことが多い）
- ぽっぽ（Expo 54 / RN 0.81）は **`pod install` 時に Xcode 16.1 以上** が必須

→ App Store ではなく、**Sonoma 対応の Xcode 16.2 を Apple から直接**入れます（無料 Apple ID で可）。

## EAS 無料枠が切れたとき

Free プランの iOS ビルドは **月 15 回まで**（Android も 15）。**毎月 1 日にリセット**（繰越なし）。

| やりたいこと | 現実的な選択 |
|--------------|--------------|
| **今すぐ** dev client が欲しい | ① 下記 Xcode 16.2 直リンク ② 知人 Mac ③ Starter $19/月（1 ヶ月だけ） |
| **数日待てる** | **翌月 1 日**に `npm run build:dev:ios:cloud`（development・本番ではない） |
| ローカルでビルド | Xcode 16.1+ 必須（15.4 では `pod install` 不可） |

確認: https://expo.dev/accounts/（Billing / Usage）

---

## 手順 A: Xcode 16.2 を手動インストール（EAS を使わない場合）

### よくある間違い

| ページ | 見えるもの | .xip がある？ |
|--------|------------|----------------|
| リリースノート（`developer.apple.com/documentation/.../Release-Notes`） | 文章だけ | **ない** |
| [Releases ニュース](https://developer.apple.com/news/releases/) の **View release notes** | 同上 | **ない** |
| **[More Downloads](https://developer.apple.com/download/all/)** | 一覧 + 雲の Download | **ある** |
| Releases の **View downloads** | ダウンロード一覧へ | **ある** |

「リリースノートしか出ない」＝ **ダウンロードページではなくメモページを開いている**状態です。

### 正しい開き方（どれか1つ）

**方法 1（いちばん簡単）**

1. ログインした状態で開く:  
   **https://developer.apple.com/download/all/?q=Xcode**
2. 一覧の **「Xcode 16.2」** の行（Release Notes ではない）
3. 右端の **雲アイコン / Download** をクリック → `Xcode_16.2.xip` が `~/Downloads` に落ちる

**方法 2（Releases から）**

1. https://developer.apple.com/news/releases/?q=xcode
2. **Xcode 16.2** の行で **「View downloads」** を押す（**View release notes ではない**）
3. 表示された一覧から `.xip` を Download

**方法 3（ログイン後に直接 URL）**

ブラウザで Apple ID ログイン済みなら、次で `.xip` が始まることがあります:

`https://developer.apple.com/services-account/download?path=/Developer_Tools/Xcode_16.2/Xcode_16.2.xip`

（未ログインだとサインイン画面になる）

### インストール

1. ダウンロードした **Xcode_16.2.xip**（約 7〜8 GB、Sonoma 14.5+ 対応）
4. ダウンロード後、`.xip` をダブルクリックして展開（時間がかかります）
5. 展開された **Xcode.app** を `/Applications` に移動
6. ターミナル:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -version   # 16.1 以上であること
```

7. ぽっぽのビルド:

```bash
cd /Users/apple/poppo
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npm run pod:install
npm run build:dev:ios
```

### 複数 Xcode がある場合

古い 15.4 を残したまま 16 を `/Applications/Xcode.app` に置けば、`xcode-select` で切り替えられます。

## 手順 B: macOS を 15（Sequoia）に上げる

**システム設定 → 一般 → ソフトウェアアップデート** で macOS 15 へ更新後、App Store から Xcode を入れる方法もあります（ディスク空き 30GB 以上推奨）。

## 手順 C: ローカル Xcode がどうしても無理なとき

**本番（production）ビルドではなく**、開発用 dev client だけクラウドで作る:

```bash
npm run build:dev:ios:cloud
```

インストール後はいつもどおり `npx expo start --dev-client` です。

---

## よくあるエラー

| 表示 | 対処 |
|------|------|
| `Please upgrade XCode` | Xcode 16.1+ に切り替え（上記手順 A） |
| `No code signing certificates` | 下記「コード署名」 |
| `Unicode Normalization... ASCII-8BIT` | `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` してから `npm run pod:install` |
| ディスク不足 | `.xip` 展開前に 40GB 以上空ける |

### コード署名（実機・シミュレータ共通で Expo が止まるとき）

1. **Xcode → Settings → Accounts** で Apple ID を追加（無料で可）
2. プロジェクトを開く: `open ios/app.xcworkspace`
3. 左 **app** → **Signing & Capabilities** → **Automatically manage signing** ON → **Team** で個人チームを選択
4. シミュレータ: `npm run build:dev:ios:sim`  
   実機: USB 接続後 `npm run build:dev:ios`
