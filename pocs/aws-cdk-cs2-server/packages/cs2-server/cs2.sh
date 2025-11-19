#!/bin/bash
# Copyright Valve Corporation
#
# This script is a modified version of cs2.sh for use in Docker containers
# and dedicated server environments that do not use the 'sniper' runtime.
GAME_PATH="$(dirname "$0")"

CS2_BIN="${GAME_PATH}/bin/linuxsteamrt64/cs2"

export LD_LIBRARY_PATH="${GAME_PATH}/bin/linuxsteamrt64:$LD_LIBRARY_PATH"

STEAM_RUNTIME="${GAME_PATH}/../../../../../steam-runtime"
if [ ! -d "$STEAM_RUNTIME" ]; then
    STEAM_RUNTIME="/home/steam/.steam/steam/steamapps/common/SteamLinuxRuntime_soldier"
fi

export STEAM_COMPAT_CLIENT_INSTALL_PATH="$HOME/.steam/steam"

exec "$CS2_BIN" "$@"
