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

CS2_BIN_EXECUTABLE="${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2"

echo "[CS2] ✅ Environment configured. Starting Binary..."

exec "${CS2_BIN_EXECUTABLE}" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
