# ぽっぽ App Store LP

App Store Connect 用のプライバシーポリシー・利用規約・サポートページ。

## Vercel デプロイ

1. [vercel.com](https://vercel.com) で新規プロジェクト
2. リポジトリ `NANBA-solution/poppo` を接続
3. **Root Directory**: `app-store-lp`
4. Deploy

## 本番 URL

- https://app-store-lp.vercel.app/
- プライバシー: https://app-store-lp.vercel.app/privacy.html

## CLI で再デプロイ

```bash
bash scripts/deploy-lp-vercel.sh
```

`src/constants/legal.ts` と App Store Connect に上記 URL を登録。
