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

echo "[BOOT] 📦 Downloading Workshop Assets (VPK)..."

gosu steam ${STEAMCMD_DIR}/steamcmd.sh \
    +login anonymous \
    +workshop_download_item 730 3461824328 \
    +quit > /dev/null

echo "[BOOT] 📂 Locating VPKs..."
WORKSHOP_FOUND=$(find /home/steam -type d -name "3461824328" -print -quit)

if [ -n "$WORKSHOP_FOUND" ]; then
    echo "[BOOT] 🎯 Found assets at: $WORKSHOP_FOUND"
    
    cat <<EOF > /tmp/extract_vpk.py
import vpk
import os
import sys

src_dir = "$WORKSHOP_FOUND"
dest_dir = "${SRCDS_DIR}/game/csgo"

print(f"[PYTHON] Scanning {src_dir} for VPKs...")

found = False
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith("_dir.vpk"):
            found = True
            vpk_path = os.path.join(root, file)
            print(f"[PYTHON] Found VPK: {vpk_path}")
            print(f"[PYTHON] Extracting to: {dest_dir}")
            
            try:
                pak = vpk.open(vpk_path)
                for filepath in pak:
                    filepath_clean = filepath.replace('\\\\', '/')
                    
                    out_path = os.path.join(dest_dir, filepath_clean)
                    os.makedirs(os.path.dirname(out_path), exist_ok=True)
                    
                    pak.get_file(filepath).save(out_path)
                    
                print(f"[PYTHON] ✅ Successfully extracted {vpk_path}")
            except Exception as e:
                print(f"[PYTHON] ❌ Error processing {file}: {e}")

if not found:
    print("[PYTHON] ⚠️ No _dir.vpk found to extract!")
EOF

    echo "[BOOT] 🔨 Running VPK Extractor..."
    python3 /tmp/extract_vpk.py
    
    if [ -f "${SRCDS_DIR}/game/csgo/soundevents/soundevents_quakesounds.vsndevts_c" ]; then
        echo "[BOOT] ✅ SUCCESS: SoundEvents file extracted correctly!"
    else
        echo "[BOOT] ⚠️ WARNING: Extraction finished but vsndevts file is missing."
        echo "[BOOT] Debug listing of game/csgo/soundevents:"
        ls -la "${SRCDS_DIR}/game/csgo/soundevents/" || true
    fi

else
    echo "[BOOT] ❌ CRITICAL: Workshop folder not found!"
fi

MM_BASE_URL="https://mms.alliedmods.net/mmsdrop/2.0/"
MM_LATEST_FILE=$(curl -s "$MM_BASE_URL" | grep -o 'mmsource-2.0.[0-9]*-git[0-9]*-linux.tar.gz' | sort -V | tail -1)
if [ -z "$MM_LATEST_FILE" ]; then
    MM_URL="https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1319-linux.tar.gz"
else
    MM_URL="${MM_BASE_URL}${MM_LATEST_FILE}"
fi
install_if_not_exists "Metamod" \
  "$ADDONS_DIR/metamod/bin/linuxsteamrt64/gamedll.so" \
  "curl -L \"${MM_URL}\" | tar -xz -C ${SRCDS_DIR}/game/csgo"

if [ -f "$GAMEINFO_FILE" ]; then
    sed -i '/quakesounds_assets/d' "$GAMEINFO_FILE"
    if ! grep -q "Game\s\+csgo/addons/metamod" "$GAMEINFO_FILE"; then
        echo "[ADDONS] Patching gameinfo.gi..."
        sed -i '/Game\s\+csgo\s*$/i \ \ \ \ \ \ \ \ \ \ \ \ Game\tcsgo/addons/metamod' "$GAMEINFO_FILE"
    fi
fi

install_if_not_exists "MultiAddonManager" \
  "$ADDONS_DIR/multiaddonmanager/bin/linuxsteamrt64/multiaddonmanager.so" \
  "curl -L https://github.com/Source2ZE/MultiAddonManager/releases/download/v1.4.8/MultiAddonManager-v1.4.8-linux.tar.gz \
    | tar -xz -C ${SRCDS_DIR}/game/csgo"

MAM_JSON="${ADDONS_DIR}/multiaddonmanager/config.json"
mkdir -p "$(dirname "$MAM_JSON")"
echo "[ADDONS] Configuring MAM via JSON to force client download (ID 3461824328)..."
cat <<EOF > "$MAM_JSON"
{
  "WorkshopItems": [
    "3461824328"
  ]
}
EOF

MAM_CFG_DIR="${SRCDS_DIR}/game/csgo/cfg/multiaddonmanager"
mkdir -p "$MAM_CFG_DIR"
MAM_CFG="${MAM_CFG_DIR}/multiaddonmanager.cfg"
echo "[ADDONS] Configuring MAM via CFG (Backup strategy)..."
cat <<EOF > "$MAM_CFG"
mm_extra_addons "3461824328"
mm_client_extra_addons "3461824328"
mm_extra_addons_timeout 10
mm_addon_mount_download 1
mm_cache_clients_with_addons 1
mm_cache_clients_duration 0
mm_block_disconnect_messages 0
mm_addon_debug 1
EOF

install_if_not_exists "CounterStrikeSharp" \
  "$ADDONS_DIR/counterstrikesharp/bin/linuxsteamrt64/counterstrikesharp.so" \
  "curl -L \"${CSS_URL}\" -o css.zip && unzip -q -o css.zip -d ${SRCDS_DIR}/game/csgo && rm css.zip"

QS_PLUGIN_PATH="${CSS_PLUGINS_DIR}/CS2-QuakeSounds/CS2-QuakeSounds.dll"
install_if_not_exists "QuakeSounds" \
  "$QS_PLUGIN_PATH" \
  "curl -L https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip -o quake.zip && unzip -q -o quake.zip -d ${CSS_PLUGINS_DIR} && rm quake.zip"

QS_CFG="${ADDONS_DIR}/counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json"
if [ -f "$QS_CFG" ]; then
    echo "[ADDONS] 🤖 Forcing 'ignore_bots: false'..."
    sed -i 's/"ignore_bots": true/"ignore_bots": false/g' "$QS_CFG"
fi

install_if_not_exists "StatusBlocker" \
  "$ADDONS_DIR/StatusBlocker/bin/linuxsteamrt64/statusblocker.so" \
  "curl -L \"${STATUS_BLOCKER_URL}\" -o statusblocker.zip && unzip -q -o statusblocker.zip -d ${SRCDS_DIR}/game/csgo && rm statusblocker.zip"

ANYBASE_URL="https://github.com/NickFox007/AnyBaseLibCS2/releases/download/0.9.4/AnyBaseLib.zip"
install_if_not_exists "AnyBaseLibCS2" \
  "$CSS_PLUGINS_DIR/AnyBaseLibCS2/AnyBaseLibCS2.dll" \
  "curl -L \"${ANYBASE_URL}\" -o anybase.zip && unzip -q -o anybase.zip -d ${SRCDS_DIR}/game/csgo && rm anybase.zip"

PLAYERSETTINGS_URL="https://github.com/NickFox007/PlayerSettingsCS2/releases/download/0.9.3/PlayerSettings.zip"
install_if_not_exists "PlayerSettings" \
  "$CSS_PLUGINS_DIR/PlayerSettings/PlayerSettings.dll" \
  "curl -L \"${PLAYERSETTINGS_URL}\" -o playersettings.zip && unzip -q -o playersettings.zip -d ${SRCDS_DIR}/game/csgo && rm playersettings.zip"

MENUMANAGER_URL="https://github.com/NickFox007/MenuManagerCS2/releases/download/1.4.1/MenuManager.zip"
install_if_not_exists "MenuManagerCS2" \
  "$CSS_PLUGINS_DIR/MenuManagerCS2/MenuManagerCS2.dll" \
  "curl -L \"${MENUMANAGER_URL}\" -o menumanager.zip && unzip -q -o menumanager.zip -d ${SRCDS_DIR}/game/csgo && rm menumanager.zip"

SIMPLE_ADMIN_URL="https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/CS2-SimpleAdmin-1.7.8-beta-7.zip"
install_if_not_exists "SimpleAdmin" \
  "$CSS_PLUGINS_DIR/CS2-SimpleAdmin/CS2-SimpleAdmin.dll" \
  "curl -L \"${SIMPLE_ADMIN_URL}\" -o simpleadmin.zip && unzip -q -o simpleadmin.zip -d ${SRCDS_DIR}/game/csgo && rm simpleadmin.zip"

SIMPLE_ADMIN_CFG_DIR="${ADDONS_DIR}/counterstrikesharp/configs/plugins/CS2-SimpleAdmin"
if [ ! -f "${SIMPLE_ADMIN_CFG_DIR}/CS2-SimpleAdmin.json" ]; then
  mkdir -p "$SIMPLE_ADMIN_CFG_DIR"
  echo '{ "Database": { "Host": "localhost", "Port": 3306, "User": "root", "Password": "", "Database": "cs2_simpleadmin", "Driver": "SQLite", "Prefix": "sa_" }, "ServerId": 1, "Debug": false }' > "${SIMPLE_ADMIN_CFG_DIR}/CS2-SimpleAdmin.json"
fi

ADMINS_CFG="${ADDONS_DIR}/counterstrikesharp/configs/admins.json"
if [ -n "${STEAM_ADMIN_IDS:-}" ]; then
  rm -f "$ADMINS_CFG" 
  mkdir -p "$(dirname "$ADMINS_CFG")"
  echo "{" > "$ADMINS_CFG"
  FIRST=1
  for id in $(echo "${STEAM_ADMIN_IDS}" | tr "," "\n"); do
    id=$(echo "$id" | xargs)
    if [ -n "$id" ]; then
        if [ $FIRST -eq 0 ]; then echo "," >> "$ADMINS_CFG"; fi
        echo "  \"Admin_$id\": { \"identity\": \"$id\", \"flags\": [\"@css/root\", \"@css/generic\", \"@css/cvar\", \"@css/rcon\"] }" >> "$ADMINS_CFG"
        FIRST=0
    fi
  done
  echo "}" >> "$ADMINS_CFG"
fi

echo "[CS2] 🔧 Fixing permissions..."
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
  +sv_pure 0 \
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
    if grep -q "Server is hibernating" "$LOG_FILE" || grep -q "Spawn Server" "$LOG_FILE"; then
        echo "[CS2] ✅ Server is RUNNING."
        READY=1
        break
    fi
    sleep 1
done

if [[ "${READY}" -ne 1 ]]; then
    echo "[CS2] ❌ Server failed to start after ${TIMEOUT}s."
    if [[ -n "${API_URL:-}" && -n "${SERVER_ID:-}" ]]; then
        (
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
          -H "Content-Type: application/json" \
          -d '{"state":"ERROR"}' \
          && echo "[CS2] ✅ Backend notified (ERROR)"
        ) & disown
    fi
else
    if [[ -n "${API_URL:-}" && -n "${SERVER_ID:-}" ]]; then
        echo "[CS2] 🔄 Sending RUNNING state to backend..."
        (
        curl -X POST "${API_URL}/servers/${SERVER_ID}/status" \
          -H "Content-Type: application/json" \
          -d '{"state":"RUNNING"}' \
          && echo "[CS2] ✅ Backend notified (RUNNING)"
        ) & disown
    fi
fi

echo "[CS2] ▶ Switching to foreground..."
wait $CS2_PID
