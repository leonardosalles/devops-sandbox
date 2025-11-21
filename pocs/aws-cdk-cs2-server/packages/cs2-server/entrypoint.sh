#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2
STEAMCMD_DIR=/home/steam/steamcmd
LOG_FILE="/tmp/cs2.log"

TIMEOUT=720

echo "[CS2] 🚀 Initializing..."
mkdir -p "$SRCDS_DIR"

SERVER_BIN="${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2"

echo "[CS2] 🚀 Starting server (background)..."

"$SERVER_BIN" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}" \
  2>&1 | tee "$LOG_FILE" &

CS2_PID=$!

echo "[CS2] 🔍 Waiting for server readiness (log-based, timeout ${TIMEOUT}s)..."

START_TIME=$(date +%s)
READY=false

tail -n 0 -F "$LOG_FILE" | while read -r line; do
  current=$(date +%s)
  elapsed=$((current - START_TIME))

  if (( elapsed > TIMEOUT )); then
    echo "[CS2] ❌ Timeout reached (${TIMEOUT}s). Server failed to start."
    break
  fi
  echo "$line" | grep -q "Server is hibernating" && READY=true && break
  echo "$line" | grep -q "ss_active" && READY=true && break
  echo "$line" | grep -q "64 player server started" && READY=true && break
  echo "$line" | grep -q "activated session on GC" && READY=true && break
done

if [[ "$READY" == true ]]; then
  echo "[CS2] ✅ Server fully RUNNING."

  if [[ -n "${API_URL:-}" && -n "${SERVER_ID:-}" ]]; then
    (
      curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
        -H "Content-Type: application/json" \
        -d '{"state":"RUNNING"}' \
        && echo "[CS2] ✅ Backend updated: RUNNING"
    ) & disown
  fi

else
  echo "[CS2] ❌ Server failed to start within ${TIMEOUT}s."

  if [[ -n "${API_URL:-}" && -n "${SERVER_ID:-}" ]]; then
    (
      curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
        -H "Content-Type: application/json" \
        -d '{"state":"ERROR"}' \
        && echo "[CS2] ⚠ Backend updated: ERROR"
    ) & disown
  fi
fi

echo "[CS2] ▶ Switching to CS2 foreground..."
wait $CS2_PID
