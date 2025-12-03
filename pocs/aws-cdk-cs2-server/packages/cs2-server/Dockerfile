FROM cm2network/cs2:latest

ENV SRCDS_DIR=/home/steam/cs2
ENV STEAMCMD_DIR=/home/steam/steamcmd
ENV TERM=dumb
ENV LD_LIBRARY_PATH="${STEAMCMD_DIR}/linux32:${STEAMCMD_DIR}/linux64"

USER root

RUN dpkg --add-architecture i386 && \
  apt-get update --allow-releaseinfo-change && \
  apt-get install -y --no-install-recommends \
  curl \
  unzip \
  ca-certificates \
  lib32gcc-s1 \
  libstdc++6:i386 \
  libcurl4:i386 \
  netcat-openbsd && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

RUN curl -L https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1374-linux.tar.gz | \
  tar -xz -C ${SRCDS_DIR}/game/csgo

RUN curl -L https://sm.alliedmods.net/smdrop/1.12/sourcemod-1.12.0-git7221-linux.tar.gz | \
  tar -xz -C ${SRCDS_DIR}/game/csgo

RUN curl -L https://github.com/Source2ZE/MultiAddonManager/releases/download/v1.4.8/MultiAddonManager-v1.4.8-linux.tar.gz | \
  tar -xz -C ${SRCDS_DIR}/game/csgo

RUN curl -L https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.347/counterstrikesharp-linux-1.0.347.zip -o css.zip && \
  unzip css.zip -d ${SRCDS_DIR}/game/csgo && \
  rm css.zip

# Quake Sounds
RUN curl -L https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip -o quake.zip \
  && unzip quake.zip -d ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/plugins/ \
  && rm quake.zip

RUN printf '{\n  "Workshop": {\n    "3461824328": { "enabled": 1 }\n  }\n}' > ${SRCDS_DIR}/game/csgo/addons/multiaddonmanager.cfg

RUN mkdir -p ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/QuakeSounds && \
  cat <<'EOF' > ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/QuakeSounds/QuakeSounds.json
{
  "enabled": true,
  "debug": false,

  "global": {
    "enabled_during_warmup": true,
    "play_on_entity": "player",
    "sound_hearable_by": "all",
    "ignore_bots": true,
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

    "3": {
      "de": "Dreifach-Kill",
      "en": "Triple Kill",
      "_sound": "QuakeSoundsD.Triplekill"
    },

    "5": {
      "de": "Multi-Kill",
      "en": "Multi Kill",
      "_sound": "QuakeSoundsD.Multikill"
    },

    "6": {
      "de": "Randale",
      "en": "Rampage",
      "_sound": "QuakeSoundsD.Rampage"
    },

    "7": {
      "de": "Abschuss-Serie",
      "en": "Killing Spree",
      "_sound": "QuakeSoundsD.Killingspree"
    },

    "8": {
      "de": "Dominierend",
      "en": "Dominating",
      "_sound": "QuakeSoundsD.Dominating"
    },

    "9": {
      "de": "Beeindruckend",
      "en": "Impressive",
      "_sound": "QuakeSoundsD.Impressive"
    },

    "10": {
      "de": "Unstoppbar",
      "en": "Unstoppable",
      "_sound": "QuakeSoundsD.Unstoppable"
    },

    "firstblood": {
      "de": "Erster Abschuss",
      "en": "First Blood",
      "_sound": "QuakeSoundsD.Firstblood"
    },

    "knifekill": {
      "de": "Messer-Kill",
      "en": "Knife Kill",
      "_sound": "QuakeSoundsD.Haha"
    },

    "teamkill": {
      "de": "Team-Kill",
      "en": "Team Kill",
      "_sound": "QuakeSoundsD.Teamkiller"
    },

    "selfkill": {
      "de": "Selbsttötung",
      "en": "Self Kill",
      "_sound": "QuakeSoundsD.Perfect"
    },

    "headshot": {
      "de": "Kopfschuss",
      "en": "Headshot",
      "_sound": "QuakeSoundsD.Headshot"
    },

    "weapon_hegrenade": {
      "de": "Granaten-Kill",
      "en": "Grenade Kill",
      "_sound": "QuakeSoundsD.Perfect"
    },

    "round_start": { "_sound": "QuakeSoundsD.Prepare" },
    "round_freeze_end": { "_sound": "QuakeSoundsD.Play" },

    "bomb_30": { "_sound": "BombSounds.Sec30" },
    "bomb_20": { "_sound": "BombSounds.Sec20" },
    "bomb_10": { "_sound": "BombSounds.Sec10" },
    "bomb_9":  { "_sound": "BombSounds.Sec9"  },
    "bomb_8":  { "_sound": "BombSounds.Sec8"  },
    "bomb_7":  { "_sound": "BombSounds.Sec7"  },
    "bomb_6":  { "_sound": "BombSounds.Sec6"  },
    "bomb_5":  { "_sound": "BombSounds.Sec5"  },
    "bomb_4":  { "_sound": "BombSounds.Sec4"  },
    "bomb_3":  { "_sound": "BombSounds.Sec3"  },
    "bomb_2":  { "_sound": "BombSounds.Sec2"  },
    "bomb_1":  { "_sound": "BombSounds.Sec1"  }
  },

  "ConfigVersion": 1
}
EOF
# End Quake Sounds

COPY cfg ${SRCDS_DIR}/game/csgo/cfg

RUN if [ -d ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting ]; then \
  for f in ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting/*.sp; do \
  if [ -f "$f" ]; then \
  echo "Compiling $f..."; \
  ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting/spcomp \
  "$f" \
  -o ${SRCDS_DIR}/game/csgo/addons/sourcemod/plugins/$(basename "$f" .sp).smx || true; \
  fi; \
  done; \
  fi

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
  chown steam:steam /entrypoint.sh && \
  chown -R steam:steam /home/steam

USER steam

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp 4380/udp

ENTRYPOINT ["/entrypoint.sh"]
