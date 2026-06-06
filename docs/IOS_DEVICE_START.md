# iOS 実機起動ガイド（ぽっぽ dev client）

**Xcode の ▶ で起動すると `localhost:8081` Connection refused が大量に出る。** それはバグではなく、実機の localhost に Metro がないため。以下の手順だけ使う。

---

## 結論（これだけ覚える）

| やりたいこと | コマンド |
|--------------|----------|
| 実機にアプリをインストール（ネイティブ変更時のみ） | `npm run build:dev:ios:device` |
| **Metro（tunnel）** — 実機接続に必須 | `npm run start:dev:tunnel` |
| 接続方式 | **tunnel（`*.exp.direct`）** — LAN / localhost は使わない |

**やってはいけないこと**

- **Xcode の ▶ で実機起動** → 端末が `localhost:8081` を探して必ず失敗
- `build:dev:ios:device` だけ実行して Metro を止める
- Metro を **8081 と 8082 で二重起動**（「Port 8081 is running in another window」が出たら古い方を止める）

---

## 正しい起動フロー

### 1. ネイティブを変えたあと（初回・pod 変更・権限追加など）

```bash
cd /Users/apple/poppo
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npm run build:dev:ios:device
```

- USB で iPhone を接続
- ビルド完了後、**Xcode ▶ は押さない**

### 2. Metro を tunnel で起動（毎日・必ず 1 プロセスだけ）

```bash
npm run start:dev:tunnel
```

ターミナルに QR と次のような URL が出る:

```
exp+poppo://expo-development-client/?url=https://xxxxx-8081.exp.direct
```

**8081 で動いていること**を確認（8082 は別 Metro が残っているサイン）。

### 3. 実機でアプリを開く

1. ホーム画面から **ぽっぽ（Development Build）** をタップ（Xcode から起動しない）
2. dev client のサーバー一覧で **`*.exp.direct`（tunnel）** をタップ
3. 出ないときは QR をカメラで読む、またはアプリを完全終了して再度開く
4. 初回は JS バンドルに **1〜2 分**（Mac のターミナルに `iOS Bundled`）

---

## 症状 → 原因 → 対処

| 症状 | 原因 | 対処 |
|------|------|------|
| `localhost:8081` / `127.0.0.1:8081` Connection refused（error 61） | Xcode ▶ 起動 or 実機が Mac の Metro を localhost で探している | **ホーム画面から起動** + **tunnel** 接続 |
| `http://localhost:19000/status` 等も全部失敗 | dev client の自動ポートスキャン（正常な挙動） | tunnel が緑なら無視してよい |
| Port 8081 is running in another window → 8082 | Metro 二重起動 | 下記「全部止める」→ `start:dev:tunnel` を 1 本だけ |
| Metro 止まったまま実機起動 | ターミナルで Ctrl+C 済み | `npm run start:dev:tunnel` を再実行 |

### 全部止めてからやり直す

```bash
pkill -f "expo start"; pkill -f "@expo/ngrok"; pkill -f "expo run:ios"
sleep 2
lsof -i :8081   # 何も出なければ OK
npm run start:dev:tunnel
```

---

## 無害な警告（無視してよい）

- `empty dSYM file detected` — デバッグシンボル。開発には影響なし
- `UIScene lifecycle will soon be required` — 将来の iOS 向け警告。現時点では起動を妨げない

---

## 関連

- [IOS_SIMULATOR_START.md](./IOS_SIMULATOR_START.md) — シミュレータ（`127.0.0.1:8081`）
- [LOCAL_IOS_BUILD.md](./LOCAL_IOS_BUILD.md) — Xcode 16.2・署名
