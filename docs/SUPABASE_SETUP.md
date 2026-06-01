# Supabase セットアップ（ぽっぽ）

フィード投稿をクラウド共有するためのバックエンドです。未設定のときは従来どおり端末内（AsyncStorage）のみで動作します。

## 1. プロジェクト作成

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. **Project Settings → API** から以下をコピー
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2. 認証（匿名ログイン）

1. **Authentication → Providers**
2. **Anonymous sign-ins** を **Enabled** にする

アプリ起動時に匿名セッションを自動作成します（端末ごとにユーザー ID が付与されます）。

## 3. データベース

1. **SQL Editor** を開く
2. リポジトリの [`supabase/schema.sql`](../supabase/schema.sql) の内容を貼り付けて **Run**

作成されるもの:

| リソース | 説明 |
|---------|------|
| `profiles` | 表示名・アバター ID |
| `feed_posts` | ぽっぽ語スタンプ投稿 |
| `pigeon_scans` | ハトコレクション（端末間同期） |
| `feed-images` | フィード投稿画像 |
| `scan-images` | コレクション写真 |

**既に `schema.sql` を実行済み**の場合は、追加で以下を順に実行してください。

- [`supabase/migrations/002_pigeon_scans.sql`](../supabase/migrations/002_pigeon_scans.sql)
- [`supabase/migrations/003_feed_reports.sql`](../supabase/migrations/003_feed_reports.sql)
- [`supabase/migrations/004_account_migration.sql`](../supabase/migrations/004_account_migration.sql)
- [`supabase/migrations/005_feed_likes.sql`](../supabase/migrations/005_feed_likes.sql)
- [`supabase/migrations/006_daily_best_and_post_limit.sql`](../supabase/migrations/006_daily_best_and_post_limit.sql)

`006` で `feed_posts_user_daily_unique_idx` の作成に失敗した場合（同日の重複投稿があるとき）は、続けて [`supabase/migrations/006b_fix_duplicate_posts.sql`](../supabase/migrations/006b_fix_duplicate_posts.sql) を実行してください。

## 3.1 Apple ログイン（引き継ぎ用）

1. **Supabase → Authentication → Providers → Apple** を有効化
2. iOS は `expo-apple-authentication` プラグインを使うため、開発ビルド/本番ビルドを作り直す
3. 設定画面の **Appleでログイン（引き継ぎ）** を実行すると、匿名ユーザーのデータを新アカウントへ移行

## 4. アプリの環境変数

`.env` に追加（`.env.example` も参照）:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

変更後は Metro を再起動してください。

```bash
npx expo start --dev-client --clear
```

## 5. 動作確認

1. フィード画面を開く → 上部に「クラウド共有中」と出れば接続 OK
2. スタンプを投稿 → Supabase **Table Editor → feed_posts** に行が増える
3. 別端末（別匿名ユーザー）でも同じフィードが見える
4. プロフィールで **フィード表示名** を変更 → フィードの投稿者名が変わる
5. スキャン後、**Table Editor → pigeon_scans** にコレクションが同期される（同じ匿名ユーザーなら別端末でも復元）
6. フィードで他ユーザー投稿の **通報** ができ、`feed_reports` に保存される
7. フィード投稿は **1日1回** まで、いいね数トップが **今日のベストぽっぽ** になり、受賞回数が称号に反映される

## セキュリティメモ

- `anon` キーはアプリに埋め込む前提の公開鍵です。RLS で読み書きを制限しています
- 本番では通報・モデレーション・レート制限などを別途検討してください
- サービスロールキー（`service_role`）は **アプリに入れない** でください

## トラブルシュート

| 症状 | 確認 |
|------|------|
| 「この端末だけのデモ」表示のまま | `.env` の URL / anon key、Metro 再起動 |
| 投稿エラー | Anonymous sign-ins 有効か、`schema.sql` 実行済みか |
| 画像が出ない | Storage バケット `feed-images` が public か |
