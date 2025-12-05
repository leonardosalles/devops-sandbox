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
  gosu \
  nodejs \
  npm && \
  rm -rf /var/lib/apt/lists/*

RUN pip3 install vpk --break-system-packages

COPY cfg ${SRCDS_DIR}/game/csgo/cfg

WORKDIR /app
COPY package.json /app/package.json
RUN npm install

COPY addons_configs /app/addons_configs

COPY index.js /app/index.js

RUN chown -R steam:steam /app

EXPOSE 27015/tcp 27015/udp 27020/udp 27005/udp

ENTRYPOINT ["node", "/app/index.js"]
