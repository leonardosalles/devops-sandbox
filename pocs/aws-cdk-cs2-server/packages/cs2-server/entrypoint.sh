#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2

echo "[CS2] Fixing permissions..."
chown -R steam:steam /home/steam || true

echo "[CS2] Cleaning previous install..."
rm -rf ${SRCDS_DIR}/* || true
mkdir -p ${SRCDS_DIR}
chown -R steam:steam ${SRCDS_DIR}

echo "[CS2] Installing / updating Counter-Strike 2..."
sudo -u steam /home/steam/steamcmd/steamcmd.sh \
  +force_install_dir ${SRCDS_DIR} \
  +login anonymous \
  +app_update 730 validate \
  +quit

echo "[CS2] Install complete."

if [ -f /compile-plugins.sh ]; then
  sudo -u steam /compile-plugins.sh || true
fi

echo "[CS2] Starting server..."
exec sudo -u steam ${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2 \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
