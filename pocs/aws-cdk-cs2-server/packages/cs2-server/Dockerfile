FROM cm2network/steamcmd:root

ENV DEBIAN_FRONTEND=noninteractive
ENV SRCDS_DIR=/home/steam/cs2

RUN dpkg --add-architecture i386 \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  sudo ca-certificates wget tar xz-utils \
  lib32gcc-s1 libc6:i386 libstdc++6:i386 \
  python3 unzip \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${SRCDS_DIR}
WORKDIR ${SRCDS_DIR}

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && chown steam:steam /entrypoint.sh

COPY addons ${SRCDS_DIR}/addons
COPY cfg ${SRCDS_DIR}/game/csgo/cfg

COPY compile-plugins.sh /compile-plugins.sh
RUN chmod +x /compile-plugins.sh \
  && chown steam:steam /compile-plugins.sh

RUN chown -R steam:steam /home/steam

USER root

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp 4380/udp

ENTRYPOINT ["/entrypoint.sh"]
