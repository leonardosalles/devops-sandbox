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

DEFAULT_STEAMAPPS="/home/steam/Steam/steamapps"
SERVER_STEAMAPPS="${SRCDS_DIR}/steamapps"
TARGET_WORKSHOP_DIR="${SERVER_STEAMAPPS}/workshop/content/730/3461824328"

if [ -d "${DEFAULT_STEAMAPPS}/workshop/content/730/3461824328" ]; then
    echo "[BOOT] 🚚 Moving SteamApps to Server Directory..."
    rm -rf "${SERVER_STEAMAPPS}"
    mv "${DEFAULT_STEAMAPPS}" "${SRCDS_DIR}/"
    echo "[BOOT] 🎯 Assets installed at: $TARGET_WORKSHOP_DIR"
    
    echo "[BOOT] 📝 Generating libraryfolders.vdf..."
    cat <<EOF > "${SERVER_STEAMAPPS}/libraryfolders.vdf"
"libraryfolders"
{
    "0"
    {
        "path"      "${SRCDS_DIR}"
        "label"     ""
        "contentid" "0"
        "totalsize" "0"
        "apps"
        {
            "730" "0"
        }
    }
}
EOF
else
    echo "[BOOT] ❌ CRITICAL: Workshop download failed in default path!"
fi

echo "[ADDONS] 🔎 Fetching latest Metamod:Source version..."
MM_BASE_URL="https://mms.alliedmods.net/mmsdrop/2.0/"
MM_LATEST_FILE=$(curl -s "$MM_BASE_URL" | grep -o 'mmsource-2.0.0-git[0-9]*-\linux.tar.gz' | sort -V | tail -n1)

if [ -z "$MM_LATEST_FILE" ]; then
  echo "[ADDONS] ❌ Failed to find Metamod version! Using fallback..."
  MM_URL="https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1374-linux.tar.gz"
else
  MM_URL="${MM_BASE_URL}${MM_LATEST_FILE}"
  echo "[ADDONS] ✅ Found latest Metamod: $MM_LATEST_FILE"
fi

echo "[ADDONS] 🔄 Installing Metamod..."
curl -L "${MM_URL}" | tar -xz -C ${SRCDS_DIR}/game/csgo

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
echo "[ADDONS] Configuring MAM (JSON)..."
cat <<'EOF' > "$MAM_JSON"
{
  "WorkshopItems": [
    "3461824328"
  ]
}
EOF

MAM_CFG_DIR="${SRCDS_DIR}/game/csgo/cfg/multiaddonmanager"
mkdir -p "$MAM_CFG_DIR"
MAM_CFG="${MAM_CFG_DIR}/multiaddonmanager.cfg"
echo "[ADDONS] Configuring MAM (CFG)..."
cat <<'EOF' > "$MAM_CFG"
mm_extra_addons "3461824328"
mm_client_extra_addons "3461824328"
mm_extra_addons_timeout 10
mm_addon_mount_download 1
EOF

echo "[ADDONS] 🔄 Installing CounterStrikeSharp..."
CSS_URL="https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.349/counterstrikesharp-with-runtime-linux-1.0.349.zip"
install_if_not_exists "CounterStrikeSharp" \
  "$ADDONS_DIR/counterstrikesharp/bin/linuxsteamrt64/counterstrikesharp.so" \
  "curl -L \"${CSS_URL}\" -o css.zip && unzip -q -o css.zip -d ${SRCDS_DIR}/game/csgo && rm css.zip"

QS_PLUGIN_PATH="${CSS_PLUGINS_DIR}/CS2-QuakeSounds/CS2-QuakeSounds.dll"
install_if_not_exists "QuakeSounds" \
  "$QS_PLUGIN_PATH" \
  "curl -L https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip -o quake.zip && unzip -q -o quake.zip -d ${CSS_PLUGINS_DIR} && rm quake.zip"

echo "[ADDONS] 📄 Generating QuakeSounds configuration..."
QS_CFG="${ADDONS_DIR}/counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json"
mkdir -p "$(dirname "$QS_CFG")"
cat <<'EOF' > "$QS_CFG"
{
  "enabled": true,
  "debug": false,
  "global": {
    "enabled_during_warmup": true,
    "play_on_entity": "player",
    "sound_hearable_by": "all",
    "ignore_bots": false,
    "ignore_world_damage": true
  },
  "precache": {
    "soundevent_file": "soundevents/soundevents_quakesounds.vsndevts"
  },
  "count_self_kills": false,
  "count_team_kills": false,
  "reset_kills_on_death": true,
  "reset_kills_on_round_start": true,
  "commands": {
    "settings": "qs",
    "settings_menu": false
  },
  "messages": {
    "enable_center_message": true,
    "center_message_type": "default",
    "enable_chat_message": true
  },
  "sound_priorities": {
    "special_events": 1,
    "weapons": 2,
    "kill_streak": 3
  },
  "sounds": {
    "2": { "en": "Double Kill", "pt": "Double Kill", "_sound": "QuakeSoundsD.Doublekill" },
    "3": { "en": "Triple Kill", "pt": "Triple Kill", "_sound": "QuakeSoundsD.Triplekill" },
    "5": { "en": "Multi Kill", "pt": "Multi Kill", "_sound": "QuakeSoundsD.Multikill" },
    "6": { "en": "Rampage", "pt": "Rampage", "_sound": "QuakeSoundsD.Rampage" },
    "7": { "en": "Killing Spree", "pt": "Killing Spree", "_sound": "QuakeSoundsD.Killingspree" },
    "8": { "en": "Dominating", "pt": "Dominating", "_sound": "QuakeSoundsD.Dominating" },
    "9": { "en": "Impressive", "pt": "Impressive", "_sound": "QuakeSoundsD.Impressive" },
    "10": { "en": "Unstoppable", "pt": "Unstoppable", "_sound": "QuakeSoundsD.Unstoppable" },
    "firstblood": { "en": "First Blood", "pt": "First Blood", "_sound": "QuakeSoundsD.Firstblood" },
    "headshot": { "en": "Headshot", "pt": "Headshot", "_sound": "QuakeSoundsD.Headshot" },
    "knifekill": { "en": "Knife Kill", "pt": "Na Faca!", "_sound": "QuakeSoundsD.Haha" },
    "round_start": { "_sound": "QuakeSoundsD.Prepare" },
    "round_freeze_end": { "_sound": "QuakeSoundsD.Play" }
  },
  "ConfigVersion": 1
}
EOF

STATUS_BLOCKER_URL="https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/StatusBlocker-linux-1.7.8-beta-7.zip"
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
mkdir -p "$SIMPLE_ADMIN_CFG_DIR"
cat <<'EOF' > "${SIMPLE_ADMIN_CFG_DIR}/CS2-SimpleAdmin.json"
{
  "Database": {
    "Host": "localhost",
    "Port": 3306,
    "User": "root",
    "Password": "",
    "Database": "cs2_simpleadmin",
    "Driver": "SQLite",
    "Prefix": "sa_"
  },
  "ServerId": 1,
  "Debug": false,
  "ChatPrefix": "{Green}[Admin]{White}",
  "OpenMenuCommands": ["admin", "css_admin", "menu"], 
  "AdminMenu": {
    "Comandos Rapidos": {
      "Kikar Todos os Bots": "bot_kick",
      "Reiniciar Partida (Live)": "mp_restartgame 1",
      "Dinheiro Infinito": "mp_maxmoney 60000; mp_startmoney 60000; mp_afterroundmoney 60000; say Ta chovendo dinheiro!",
      "Travar Bots (Stop)": "bot_stop 1",
      "Destravar Bots (Move)": "bot_stop 0"
    }
  }
}
EOF

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

echo "[CS2] 📝 Generating server.cfg..."

SERVER_CFG_DIR="${SRCDS_DIR}/game/csgo/cfg"
SERVER_CFG_FILE="${SERVER_CFG_DIR}/server.cfg"

mkdir -p "${SERVER_CFG_DIR}"

cat <<'EOF' > "${SERVER_CFG_FILE}"
hostname "Watercooler - Server"

sv_password ""
sv_cheats 1
sv_autobunny 0
sv_lan 0
sv_region 255

mp_maxrounds 30
mp_roundtime 5
mp_free_armor 0

sv_allow_votes 1

sv_minupdaterate 64
sv_maxupdaterate 128
sv_minrate 786432
sv_maxrate 786432
sv_maxcmdrate 128

sv_force_preload 1

mp_friendlyfire 1
mp_autokick 0
mp_tkpunish 0
mp_spectators_max 32
mp_forcecamera 0
mp_limitteams 0
mp_autoteambalance 0
EOF

chown steam:steam "${SERVER_CFG_FILE}"

echo "[CS2] ✅ server.cfg created at ${SERVER_CFG_FILE}"


echo "[CS2] 🔧 Fixing permissions..."
chown -R steam:steam "${SRCDS_DIR}"

echo "[CS2] 🔧 Setting up Steam Environment to prevent SIGSEGV..."
mkdir -p /home/steam/.steam/sdk64
cp "${STEAMCMD_DIR}/linux64/steamclient.so" /home/steam/.steam/sdk64/steamclient.so || true
cp "${STEAMCMD_DIR}/linux64/steamclient.so" "${SRCDS_DIR}/game/bin/linuxsteamrt64/steamclient.so" || true

echo "730" > "${SRCDS_DIR}/game/bin/linuxsteamrt64/steam_appid.txt"
echo "730" > "${SRCDS_DIR}/steam_appid.txt"

mkdir -p "${SRCDS_DIR}/game/steam_staging"
mkdir -p "${SRCDS_DIR}/steamapps/workshop"
mkdir -p "${SRCDS_DIR}/steamapps/shadercache"

chown -R steam:steam /home/steam/.steam "${SRCDS_DIR}/game/steam_staging" "${SRCDS_DIR}/steamapps" 2>/dev/null || true

SERVER_BIN_DIR="${SRCDS_DIR}/game/bin/linuxsteamrt64"
CSGO_BIN_PATH="${SRCDS_DIR}/game/csgo/bin/linuxsteamrt64"
STEAMCMD_BIN_PATH="${STEAMCMD_DIR}/linux64"
export LD_LIBRARY_PATH="${SERVER_BIN_DIR}:${CSGO_BIN_PATH}:${STEAMCMD_BIN_PATH}:${LD_LIBRARY_PATH:-}"

LOG_FILE="/tmp/cs2.log"
touch "${LOG_FILE}"
chown steam:steam "${LOG_FILE}"

echo "[CS2] 🚀 Starting server..."

cd "${SERVER_BIN_DIR}"

gosu steam ./cs2 \
  -game csgo \
  -dedicated \
  -insecure \
  -usercon \
  -console \
  +exec server.cfg \
  +sv_setsteamaccount "${GSLT}" \
  +rcon_password "${RCON_PASSWORD}" \
  +hostname "${SERVER_HOSTNAME:-Watercooler Server}" \
  +map "${INITIAL_MAP:-de_inferno}" \
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
