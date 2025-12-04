FROM cm2network/cs2:latest

ENV SRCDS_DIR=/home/steam/cs2
ENV STEAMCMD_DIR=/home/steam/steamcmd
ENV TERM=dumb

USER root

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  curl \
  unzip \
  ca-certificates \
  netcat-openbsd \
  gosu && \
  rm -rf /var/lib/apt/lists/*

COPY cfg ${SRCDS_DIR}/game/csgo/cfg

COPY addons_configs/QuakeSounds.json ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json
COPY addons_configs/SimpleAdmin.json ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/SimpleAdmin/SimpleAdmin.json

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
  chown steam:steam /entrypoint.sh

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp

ENTRYPOINT ["/entrypoint.sh"]
