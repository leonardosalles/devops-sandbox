#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2
STEAMCMD_DIR=/home/steam/steamcmd

echo "[CS2] 🚀 Initializing..."
mkdir -p "${SRCDS_DIR}"

SERVER_BIN_PATH="${SRCDS_DIR}/game/bin/linuxsteamrt64"
CSGO_BIN_PATH="${SRCDS_DIR}/game/csgo/bin/linuxsteamrt64"
STEAMCMD_BIN_PATH="${STEAMCMD_DIR}/linux64"

export LD_LIBRARY_PATH="${SERVER_BIN_PATH}:${CSGO_BIN_PATH}:${STEAMCMD_BIN_PATH}:${LD_LIBRARY_PATH}"
CS2_BIN="${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2"

LOG_FILE="/tmp/cs2.log"

echo "[CS2] 🚀 Starting server in background..."
"${CS2_BIN}" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}" \
  2>&1 | tee "${LOG_FILE}" &

CS2_PID=$!

echo "[CS2] 🔍 Waiting for server readiness (log-based)..."

TIMEOUT=720
for i in $(seq 1 $TIMEOUT); do
    if grep -q "Server is hibernating" "$LOG_FILE"; then
        echo "[CS2] ✅ Server is RUNNING (hibernating detected)."
        READY=1
        break
    fi
    if grep -q "Spawn Server" "$LOG_FILE"; then
        echo "[CS2] ✅ Map loaded, server is running."
        READY=1
        break
    fi
    sleep 1
done

if [[ "${READY:-0}" -ne 1 ]]; then
    echo "[CS2] ❌ Server failed to start after ${TIMEOUT}s."
    (
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
          -H "Content-Type: application/json" \
          -d '{"state":"ERROR"}' \
          && echo "[CS2] ✅ Backend notified"
        ) & disown
else
    if [[ -n "${API_URL:-}" && -n "${SERVER_ID:-}" ]]; then
        echo "[CS2] 🔄 Sending RUNNING state to backend..."
        (
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
          -H "Content-Type: application/json" \
          -d '{"state":"RUNNING"}' \
          && echo "[CS2] ✅ Backend notified"
        ) & disown
    fi
fi

echo "[CS2] ▶ Switching to CS2 foreground..."
wait $CS2_PID
