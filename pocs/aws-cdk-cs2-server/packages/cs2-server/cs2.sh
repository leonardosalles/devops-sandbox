#!/bin/bash
set -euo pipefail

CS2_ROOT_DIR="${CS2_ROOT_DIR:-/home/steam/cs2}"
CS2_BIN="${CS2_ROOT_DIR}/game/bin/linuxsteamrt64/cs2"

GAME_PATH="$(dirname "$0")"

export LD_LIBRARY_PATH="${GAME_PATH}/bin/linuxsteamrt64:$LD_LIBRARY_PATH"

STEAM_RUNTIME="${GAME_PATH}/../../../../../steam-runtime"
if [ ! -d "$STEAM_RUNTIME" ]; then
    STEAM_RUNTIME="/home/steam/.steam/steam/steamapps/common/SteamLinuxRuntime_soldier"
fi

export STEAM_COMPAT_CLIENT_INSTALL_PATH="$HOME/.steam/steam"

exec "$CS2_BIN" "$@"
