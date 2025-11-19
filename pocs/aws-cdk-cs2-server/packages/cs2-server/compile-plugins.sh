#!/usr/bin/env bash
SRCDS_DIR=/cs2

SP_DIR="${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting"
PLUGINS_DIR="${SRCDS_DIR}/game/csgo/addons/sourcemod/plugins"

if [ ! -d "$SP_DIR" ]; then
  echo "No scripting folder found. Skipping compile."
  exit 0
fi

echo "[Plugins] Compiling..."
mkdir -p "$PLUGINS_DIR"

for f in $SP_DIR/*.sp; do
  if [ -f "$f" ]; then
    $SP_DIR/spcomp "$f" -o $PLUGINS_DIR/$(basename "$f" .sp).smx || true
  fi
done

echo "[Plugins] Compile complete."
