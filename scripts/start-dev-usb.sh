#!/usr/bin/env bash
# 実機用 Metro 起動。iproxy があれば USB、なければ LAN
set -euo pipefail
cd "$(dirname "$0")/.."

# 8081 の二重起動を防ぐ
pkill -f "expo start" 2>/dev/null || true
pkill -f "@expo/ngrok" 2>/dev/null || true
pkill -f "iproxy 8081" 2>/dev/null || true
sleep 2

if command -v iproxy &>/dev/null; then
  pkill -f "iproxy 8081" 2>/dev/null || true
  sleep 1
  iproxy 8081 8081 &
  IPROXY_PID=$!
  trap 'kill "$IPROXY_PID" 2>/dev/null || true' EXIT INT TERM
  echo "USB モード (iproxy → 127.0.0.1:8081)"
  echo "別ターミナルで: npm run open:ios:device"
  echo ""
  export REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1
  exec npx expo start --dev-client --localhost
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  echo "iproxy も LAN IP も使えません。"
  echo "  brew install libimobiledevice  → USB モード"
  echo "  または npm run start:dev:tunnel → tunnel モード"
  exit 1
fi

echo "LAN モード (${LAN_IP}:8081) — iPhone と Mac を同じ Wi‑Fi に"
echo "別ターミナルで: npm run open:ios:device"
echo ""
export REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP"
export POPPO_METRO_URL="http://${LAN_IP}:8081"
exec npx expo start --dev-client --lan
