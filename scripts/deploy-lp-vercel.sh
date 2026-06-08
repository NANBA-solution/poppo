#!/usr/bin/env bash
# app-store-lp を Vercel にデプロイ（初回はブラウザでログインが必要）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app-store-lp"

echo "→ Vercel にデプロイします（app-store-lp）"
echo "  初回: 表示された URL でログイン"
echo ""

npx vercel@latest deploy --prod "$@"

echo ""
echo "✅ 完了。表示された Production URL を App Store Connect と src/constants/legal.ts に登録してください。"
