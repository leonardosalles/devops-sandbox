FROM cm2network/cs2:latest

ENV SRCDS_DIR=/home/steam/cs2
USER root

RUN dpkg --add-architecture i386 && \
  apt-get update --allow-releaseinfo-change && \
  apt-get install -y --allow-unauthenticated --no-install-recommends dirmngr debian-archive-keyring && \
  rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  lib32gcc-s1 \
  libstdc++6:i386 \
  libcurl4:i386 \
  ca-certificates && \
  rm -rf /var/lib/apt/lists/*

ENV STEAMCMD_DIR=/home/steam/steamcmd
ENV TERM=dumb
ENV LD_LIBRARY_PATH="${STEAMCMD_DIR}/linux32:${STEAMCMD_DIR}/linux64"

COPY addons ${SRCDS_DIR}/game/csgo/addons
COPY cfg ${SRCDS_DIR}/game/csgo/cfg

RUN if [ -d ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting ]; then \
  for f in ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting/*.sp; do \
  if [ -f "$f" ]; then \
  echo "Compiling $f..."; \
  ${SRCDS_DIR}/game/csgo/addons/sourcemod/scripting/spcomp \
  "$f" \
  -o ${SRCDS_DIR}/game/csgo/addons/sourcemod/plugins/$(basename "$f" .sp).smx \
  || echo "Failed to compile $f"; \
  fi; \
  done; \
  else \
  echo "No scripting directory found!"; \
  fi

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && chown steam:steam /entrypoint.sh

RUN chown -R steam:steam /home/steam

USER steam

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp 4380/udp

ENTRYPOINT ["/entrypoint.sh"]
