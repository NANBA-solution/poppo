# App Store 審査チェックリスト（ぽっぽ / poppo）

## Connect に登録する URL

| 項目 | URL |
|------|-----|
| プライバシーポリシー | https://app-store-lp.vercel.app/privacy.html |
| サポート | https://app-store-lp.vercel.app/ |
| 連絡先メール | nanbacoltd.95@gmail.com |

**LP**: https://app-store-lp.vercel.app/（更新時は `bash scripts/deploy-lp-vercel.sh`）

---

## App のプライバシー（データ収集の申告）

| 質問 | 回答 |
|------|------|
| データを収集しますか？ | **いいえ**（アカウントなし・サーバー送信なし） |
| 写真・動画 | **はい** — 端末内のみ（リンク：プライバシーポリシー） |
| トラッキング | **いいえ** |
| 第三者広告 | **いいえ** |

※ カメラで撮った写真は端末内コレクションに保存。クラウドへ送信しない。

---

## 年齢制限

| 項目 | 回答 |
|------|------|
| 成人向けコンテンツ | いいえ |
| ギャンブル | いいえ |
| 医療/治療情報 | いいえ |
| 無制限の Web アクセス | いいえ |
| ユーザー生成コンテンツ（フィード） | **いいえ**（SNS へのエクスポートのみ） |
| **結果** | **4+** |

---

## 輸出コンプライアンス

- `ITSAppUsesNonExemptEncryption: false`（`app.config.js` 設定済み）
- Connect の質問: 暗号化 **はい** → 免除のみ **はい**

---

## App Review 情報（英語メモ例）

```
No login required. All pigeon scans and photos are stored locally on device only.

To test the core flow:
1. Complete onboarding (or tap Skip).
2. Grant camera permission when prompted.
3. Point the camera at a pigeon photo (or any photo containing a bird/pigeon).
4. Tap shutter → wait for on-device ML detection → collection saves as "Scan #N".

Pigeon detection uses on-device ML Kit (no cloud AI). No account, no server sync.

Notifications are OFF by default. To test:
Settings → enable "Poppo alerts" → allow iOS notification permission.
Daily local notification at 10:00. Quest completion triggers a local alert.

Data deletion: Settings → Delete all collection.

Privacy policy: https://app-store-lp.vercel.app/privacy.html
Support: https://app-store-lp.vercel.app/
```

---

## スクリーンショット

- **iPhone 専用**（`targetedDeviceFamily: 1`）→ 6.5 / 6.7 インチのみ、3枚以上
- 推奨画面: カメラ、スキャン成功、コレクション、クエスト

---

## 審査で説明が必要な権限

| 権限 | 用途 |
|------|------|
| カメラ | ハトスキャン撮影 |
| 写真ライブラリ（追加のみ） | Instagram 共有時の一時保存 |
| 通知（オプトイン） | 毎日リマインド・クエスト達成（ローカルのみ） |

**マイク権限なし** / **Apple ログインなし** / **位置情報なし**

---

## 提出前チェック

- [ ] LP を Vercel にデプロイし URL が開ける
- [ ] GitHub Secrets 4 つ登録済み
- [ ] Actions で TestFlight ビルド成功
- [ ] Connect でアプリ `ぽっぽ` 作成・Bundle ID `app.poppo.mobile`
- [ ] TestFlight Processing 完了
- [ ] 審査用ビルドを選択 → メタデータ・スクショ入力 → 審査提出
