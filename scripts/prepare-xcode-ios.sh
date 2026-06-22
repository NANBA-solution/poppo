#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ npm install"
npm install

echo "→ pod install (Codegen 生成含む)"
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios
pod install

echo ""
echo "✓ 準備完了。Xcode では ios/app.xcworkspace を開いてビルドしてください。"
echo "  Metro: npm run start:dev:clear"
