#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2/game

echo "Starting Watercooler Server..."

exec "${SRCDS_DIR}/bin/linuxsteamrt64/cs2" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
