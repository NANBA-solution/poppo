#!/usr/bin/env bash
# App Store Connect API 秘密鍵を base64 1行にしてクリップボードへ（画面には出さない）
set -euo pipefail

KEY_ID="${APPSTORE_API_KEY_ID:-7HZ2G9DHBY}"
P8="${APPSTORE_API_P8_PATH:-$HOME/Downloads/AuthKey_${KEY_ID}.p8}"

if [[ ! -f "$P8" ]]; then
  echo "❌ .p8 が見つかりません: $P8"
  echo ""
  echo "Connect からダウンロードした AuthKey_${KEY_ID}.p8 を置くか、パスを指定:"
  echo "  APPSTORE_API_P8_PATH=~/Downloads/AuthKey_XXXX.p8 bash ci/copy-appstore-api-key.sh"
  exit 1
fi

if ! openssl pkey -in "$P8" -noout 2>/dev/null; then
  echo "❌ 有効な秘密鍵ではありません: $P8"
  exit 1
fi

base64 -i "$P8" | tr -d '\n' | pbcopy
BYTES="$(pbpaste | wc -c | tr -d ' ')"

echo "✅ クリップボードにコピーしました（base64 ${BYTES} 文字）"
echo ""
echo "次: GitHub → Settings → Secrets → Actions"
echo "  Secret 名: APPSTORE_API_PRIVATE_KEY"
echo "  値欄に Cmd+V → Save"
echo ""
echo "  https://github.com/NANBA-solution/poppo/settings/secrets/actions"
echo ""
echo "⚠️  秘密鍵はチャット・スクショに貼らない。pbpaste で中身を表示しないこと。"
