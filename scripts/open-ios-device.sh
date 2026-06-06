#!/usr/bin/env bash
# QR 不要: USB/LAN 経由で iPhone に dev client を起動
set -euo pipefail

DEVICE_ID="${POPPO_IOS_DEVICE_ID:-00008110-001C29C011D9A01E}"
BUNDLE_ID="app.poppo.mobile"

pick_metro_url() {
  if [ -n "${POPPO_METRO_URL:-}" ]; then
    echo "$POPPO_METRO_URL"
    return
  fi
  if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
    echo "http://127.0.0.1:8081"
    return
  fi
  local ip
  ip="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  if [ -n "$ip" ] && curl -sf "http://${ip}:8081/status" >/dev/null 2>&1; then
    echo "http://${ip}:8081"
    return
  fi
  local tunnel
  tunnel="$(curl -sf http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "
import json, sys
for t in json.load(sys.stdin).get('tunnels', []):
    u = t.get('public_url', '')
    if u.startswith('https://') and 'exp.direct' in u:
        print(u)
        break
" 2>/dev/null || true)"
  if [ -n "$tunnel" ]; then
    echo "$tunnel"
    return
  fi
  echo ""
}

METRO_URL="$(pick_metro_url)"
if [ -z "$METRO_URL" ]; then
  echo "エラー: Metro が見つかりません。"
  echo "ターミナル1で npm run start:dev:usb を起動してください。"
  exit 1
fi

ENCODED_URL="$(python3 -c "import urllib.parse; print(urllib.parse.quote('${METRO_URL}', safe=''))")"
DEEP_LINK="exp+poppo://expo-development-client/?url=${ENCODED_URL}"

echo "Metro: ${METRO_URL}"
echo "iPhone に接続中…"

xcrun devicectl device process launch \
  --device "$DEVICE_ID" \
  --payload-url "$DEEP_LINK" \
  "$BUNDLE_ID"

echo "起動しました。ターミナルに iOS Bundled が出れば完了です。"
