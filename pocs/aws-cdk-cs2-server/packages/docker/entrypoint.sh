#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/cs2

: "${GSLT:=}"
: "${RCON_PASSWORD:=}"
: "${SERVER_HOSTNAME:=CS2 - Modded}"
: "${MAP:=de_inferno}"
: "${MODE:=hybrid}"  # hybrid = admin menu can switch modes

echo "GSLT=${GSLT}" > /envfile
echo "RCON_PASSWORD=${RCON_PASSWORD}" >> /envfile

# Ensure csgo cfg dir exists
mkdir -p ${SRCDS_DIR}/csgo/cfg

# Link plugins folder if not present
if [ ! -d "${SRCDS_DIR}/addons/sourcemod/plugins" ]; then
  mkdir -p ${SRCDS_DIR}/addons/sourcemod/plugins
fi

echo "Starting server: mode=${MODE}, map=${MAP}"
exec ${SRCDS_DIR}/srcds_run -game csgo -console -usercon -autoupdate +sv_setsteamaccount "${GSLT}" +rcon_password "${RCON_PASSWORD}" +map "${MAP}" +hostname "${SERVER_HOSTNAME}"
