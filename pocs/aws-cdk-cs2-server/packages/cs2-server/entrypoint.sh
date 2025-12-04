#!/usr/bin/env bash
set -euo pipefail

SRCDS_DIR="/home/steam/cs2"
ADDONS_DIR="${SRCDS_DIR}/game/csgo/addons"
GAMEINFO_FILE="${SRCDS_DIR}/game/csgo/gameinfo.gi"
CSS_PLUGINS_DIR="${ADDONS_DIR}/counterstrikesharp/plugins"
STEAMCMD_DIR="/home/steam/steamcmd"

mkdir -p "$ADDONS_DIR"

install_if_not_exists() {
  local name="$1"
  local check_path="$2"
  local install_cmd="$3"

  if [ ! -e "$check_path" ]; then
    echo "[ADDONS] Installing ${name}..."
    eval "$install_cmd"
    echo "[ADDONS] ${name} installed."
  else
    echo "[ADDONS] ${name} already installed."
  fi
}

echo "[BOOT] 📦 Checking/Downloading Workshop Assets (Sounds)..."

gosu steam ${STEAMCMD_DIR}/steamcmd.sh \
    +login anonymous \
    +workshop_download_item 730 3461824328 \
    +quit > /dev/null

echo "[BOOT] 📂 Installing Workshop Assets to game folder..."

WORKSHOP_DIR="${STEAMCMD_DIR}/steamapps/workshop/content/730/3461824328"

if [ -d "$WORKSHOP_DIR" ]; then
    cp -rn "$WORKSHOP_DIR"/* "${SRCDS_DIR}/game/csgo/"
    echo "[BOOT] ✅ Assets installed successfully."
else
    echo "[BOOT] ⚠️ Warning: Workshop assets not found at $WORKSHOP_DIR"
fi

MM_BASE_URL="https://mms.alliedmods.net/mmsdrop/2.0/"
MM_LATEST_FILE=$(curl -s "$MM_BASE_URL" | grep -o 'mmsource-2.0.[0-9]*-git[0-9]*-linux.tar.gz' | sort -V | tail -1)

if [ -z "$MM_LATEST_FILE" ]; then
    echo "[ADDONS] ⚠️ Failed to fetch latest Metamod. Using fallback..."
    MM_URL="https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1319-linux.tar.gz"
else
    MM_URL="${MM_BASE_URL}${MM_LATEST_FILE}"
    echo "[ADDONS] 🔄 Found latest Metamod build: $MM_LATEST_FILE"
fi

install_if_not_exists "Metamod" \
  "$ADDONS_DIR/metamod/bin/linuxsteamrt64/gamedll.so" \
  "curl -L \"${MM_URL}\" | tar -xz -C ${SRCDS_DIR}/game/csgo"

echo "[ADDONS] Checking gameinfo.gi for Metamod entry..."
if [ -f "$GAMEINFO_FILE" ]; then
    if ! grep -q "Game\s\+csgo/addons/metamod" "$GAMEINFO_FILE"; then
        echo "[ADDONS] Patching gameinfo.gi..."
        sed -i '/Game\s\+csgo\s*$/i \ \ \ \ \ \ \ \ \ \ \ \ Game\tcsgo/addons/metamod' "$GAMEINFO_FILE"
        echo "[ADDONS] gameinfo.gi patched successfully."
    else
        echo "[ADDONS] gameinfo.gi is already patched."
    fi
else
    echo "[ADDONS] WARNING: gameinfo.gi not found! Mods might not load."
fi

CSS_URL="https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.347/counterstrikesharp-with-runtime-linux-1.0.347.zip"

install_if_not_exists "CounterStrikeSharp" \
  "$ADDONS_DIR/counterstrikesharp/bin/linuxsteamrt64/counterstrikesharp.so" \
  "curl -L \"${CSS_URL}\" -o css.zip \
    && unzip -q -o css.zip -d ${SRCDS_DIR}/game/csgo \
    && rm css.zip"

QS_PLUGIN_PATH="${CSS_PLUGINS_DIR}/CS2-QuakeSounds/CS2-QuakeSounds.dll"

install_if_not_exists "QuakeSounds" \
  "$QS_PLUGIN_PATH" \
  "curl -L https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip -o quake.zip \
    && unzip -q -o quake.zip -d ${CSS_PLUGINS_DIR} \
    && rm quake.zip"

ADMINS_CFG="${ADDONS_DIR}/counterstrikesharp/configs/admins.json"

if [ -n "${STEAM_ADMIN_IDS:-}" ]; then
  rm -f "$ADMINS_CFG" 
  mkdir -p "$(dirname "$ADMINS_CFG")"
  echo "[ADDONS] 👑 Configuring CSS Admins..."
  
  echo "{" > "$ADMINS_CFG"
  FIRST_ENTRY=1
  
  for id in $(echo "${STEAM_ADMIN_IDS}" | tr "," "\n"); do
    id=$(echo "$id" | xargs)
    if [ -n "$id" ]; then
        if [ $FIRST_ENTRY -eq 0 ]; then echo "," >> "$ADMINS_CFG"; fi
        
        echo "  \"Admin_$id\": {" >> "$ADMINS_CFG"
        echo "    \"identity\": \"$id\"," >> "$ADMINS_CFG"
        echo "    \"flags\": [\"@css/root\", \"@css/generic\", \"@css/cvar\", \"@css/rcon\"]" >> "$ADMINS_CFG"
        echo -n "  }" >> "$ADMINS_CFG"
        
        echo "[ADDONS] -> Added Admin: $id"
        FIRST_ENTRY=0
    fi
  done
  echo "" >> "$ADMINS_CFG"
  echo "}" >> "$ADMINS_CFG"
fi

echo "[CS2] 🔧 Fixing permissions recursively..."
chown -R steam:steam "${SRCDS_DIR}"

SERVER_BIN_PATH="${SRCDS_DIR}/game/bin/linuxsteamrt64"
CSGO_BIN_PATH="${SRCDS_DIR}/game/csgo/bin/linuxsteamrt64"
STEAMCMD_BIN_PATH="${STEAMCMD_DIR}/linux64"

export LD_LIBRARY_PATH="${SERVER_BIN_PATH}:${CSGO_BIN_PATH}:${STEAMCMD_BIN_PATH}:${LD_LIBRARY_PATH:-}"

CS2_BIN="${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2"
LOG_FILE="/tmp/cs2.log"

touch "${LOG_FILE}"
chown steam:steam "${LOG_FILE}"

echo "[CS2] 🚀 Starting server..."

gosu steam "${CS2_BIN}" \
  -game csgo \
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

echo "[CS2] 🔍 Waiting for server readiness..."

TIMEOUT=720
READY=0
for i in $(seq 1 $TIMEOUT); do
    if grep -q "Server is hibernating" "$LOG_FILE"; then
        echo "[CS2] ✅ Server is RUNNING (hibernating)."
        READY=1
        break
    fi
    if grep -q "Spawn Server" "$LOG_FILE"; then
        echo "[CS2] ✅ Map loaded, server running."
        READY=1
        break
    fi
    sleep 1
done

if [[ "${READY}" -ne 1 ]]; then
    echo "[CS2] ❌ Server failed to start."
    if [[ -n "${API_URL:-}" ]]; then
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" -H "Content-Type: application/json" -d '{"state":"ERROR"}' & disown
    fi
else
    if [[ -n "${API_URL:-}" ]]; then
        echo "[CS2] 🔄 Sending RUNNING state..."
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" -H "Content-Type: application/json" -d '{"state":"RUNNING"}' & disown
    fi
fi

echo "[CS2] ▶ Switching to foreground..."
wait $CS2_PID
