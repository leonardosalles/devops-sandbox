#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2

GSLT="${GSLT:-}"
RCON_PASSWORD="${RCON_PASSWORD:-}"
SERVER_HOSTNAME="${SERVER_HOSTNAME:-Watercooler Server}"
MAP="${MAP:-de_inferno}"

echo "[CS2] Updating server build..."
/home/steam/steamcmd/steamcmd.sh \
    +force_install_dir ${SRCDS_DIR} \
    +login anonymous \
    +app_update 730 -validate \
    +quit

echo "[CS2] Starting server..."

exec ${SRCDS_DIR}/csgo/bin/linuxsteamrt64/cs2 \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME}" \
  +map "${MAP}"
