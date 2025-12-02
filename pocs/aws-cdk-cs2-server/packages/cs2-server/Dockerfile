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

COPY addons ${SRCDS_DIR}/game/csgo/addons
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
