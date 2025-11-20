#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2
STEAMCMD_DIR=/home/steam/steamcmd

echo "[CS2] 🚀 Verifying and Installing CS2..."
mkdir -p "${SRCDS_DIR}"

echo "[CS2] Setting permissions for user steam..."
chown -R steam:steam /home/steam/cs2 || true 

MAX_RETRIES=5
RETRY_COUNT=0

while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
  echo "[CS2] Download/Validation attempt: $((RETRY_COUNT + 1)) of ${MAX_RETRIES}..."
  
  ${STEAMCMD_DIR}/steamcmd.sh \
    +@sSteamCmdForcePlatformType linux \
    +set_steam_cmd_timeout 120 \
    +force_install_dir ${SRCDS_DIR} \
    +login anonymous \
    +app_update 730 validate \
    +exit

  if [ $? -eq 0 ]; then
    echo "[CS2] ✅ Download and validation completed successfully!"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "[CS2] ⚠️ Download or validation failed. Retrying in 10 seconds..."
    sleep 10
  fi
done

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
  echo "[CS2] ❌ Critical failure: CS2 download or validation failed after ${MAX_RETRIES} attempts. Aborting."
  exit 1
fi

SERVER_BIN_PATH="${SRCDS_DIR}/game/bin/linuxsteamrt64"
CSGO_BIN_PATH="${SRCDS_DIR}/game/csgo/bin/linuxsteamrt64"
STEAMCMD_BIN_PATH="${STEAMCMD_DIR}/linux64" 

export LD_LIBRARY_PATH="${SERVER_BIN_PATH}:${CSGO_BIN_PATH}:${STEAMCMD_BIN_PATH}:${LD_LIBRARY_PATH}"

CS2_WRAPPER_SCRIPT="${SRCDS_DIR}/game/csgo/cs2.sh"

echo "[CS2] LD_LIBRARY_PATH set. Starting Server via Valve Wrapper Script..."

exec "${CS2_WRAPPER_SCRIPT}" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
