#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2

echo "[CS2] Ensuring install directory exists..."
mkdir -p "${SRCDS_DIR}"

echo "[CS2] Updating server..."
/home/steam/steamcmd/steamcmd.sh \
  +force_install_dir ${SRCDS_DIR} \
  +login anonymous \
  +app_update 730 validate \
  +quit

echo "[CS2] Update complete."

echo "[CS2] Starting Watercooler Server..."

exec ${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2 \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
