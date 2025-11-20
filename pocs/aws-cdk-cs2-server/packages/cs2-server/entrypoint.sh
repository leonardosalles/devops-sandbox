#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR=/home/steam/cs2
STEAMCMD_DIR=/home/steam/steamcmd

echo "[CS2] 🚀 Verificando e Instalando o Servidor CS2..."
mkdir -p "${SRCDS_DIR}"

MAX_RETRIES=5
RETRY_COUNT=0

while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
  echo "[CS2] Tentativa de download/validação: $((RETRY_COUNT + 1)) de ${MAX_RETRIES}..."
  
  ${STEAMCMD_DIR}/steamcmd.sh \
    +@sSteamCmdForcePlatformType linux \
    +set_steam_cmd_timeout 120 \
    +force_install_dir ${SRCDS_DIR} \
    +login anonymous \
    +app_update 730 validate \
    +exit

  if [ $? -eq 0 ]; then
    echo "[CS2] ✅ Download e validação completos com sucesso!"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "[CS2] ⚠️ Falha no download ou validação. Tentando novamente em 10 segundos..."
    sleep 10
  fi
done

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
  echo "[CS2] ❌ Falha crítica: O download ou validação do CS2 falhou após ${MAX_RETRIES} tentativas. Abortando."
  exit 1
fi

SERVER_BIN_PATH="${SRCDS_DIR}/game/bin/linuxsteamrt64"
CSGO_BIN_PATH="${SRCDS_DIR}/game/csgo/bin/linuxsteamrt64"
STEAMCMD_BIN_PATH="${STEAMCMD_DIR}/linux64" 

export LD_LIBRARY_PATH="${SERVER_BIN_PATH}:${CSGO_BIN_PATH}:${STEAMCMD_BIN_PATH}:${LD_LIBRARY_PATH}"

CS2_WRAPPER_SCRIPT="${SRCDS_DIR}/game/csgo/cs2.sh"

echo "[CS2] ✅ LD_LIBRARY_PATH forçado. Iniciando Servidor via Wrapper Script da Valve..."

exec "${CS2_WRAPPER_SCRIPT}" \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${MAP:-de_inferno}"
