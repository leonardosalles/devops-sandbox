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
  libsqlite3-0 \
  python3 \
  python3-pip \
  python3-setuptools \
  gosu && \
  rm -rf /var/lib/apt/lists/*

RUN pip3 install vpk --break-system-packages

COPY cfg ${SRCDS_DIR}/game/csgo/cfg
COPY addons_configs/QuakeSounds.json ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json
COPY addons_configs/SimpleAdmin.json ${SRCDS_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/CS2-SimpleAdmin/CS2-SimpleAdmin.json

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
  chown steam:steam /entrypoint.sh

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp

ENTRYPOINT ["/entrypoint.sh"]
