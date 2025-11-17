FROM --platform=linux/amd64 cm2network/steamcmd:root

# Environment
ENV DEBIAN_FRONTEND=noninteractive
ENV SRCDS_DIR=/cs2

# Stable versions (confirmed 200 OK)
ENV MM_DOWNLOAD_URL=https://mms.alliedmods.net/mmsdrop/1.12/mmsource-1.12.0-git1179-linux.tar.gz
ENV SM_DOWNLOAD_URL=https://sm.alliedmods.net/smdrop/1.12/sourcemod-1.12.0-git6915-linux.tar.gz

# Install dependencies and 32-bit support
RUN dpkg --add-architecture i386 \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  ca-certificates wget tar xz-utils \
  lib32gcc-s1 libc6:i386 libstdc++6:i386 \
  python3 zip unzip file build-essential \
  && rm -rf /var/lib/apt/lists/*

# Prepare directory
RUN mkdir -p ${SRCDS_DIR}
WORKDIR ${SRCDS_DIR}

# Install CS2/CSGO dedicated server (app 740)
RUN ./steamcmd.sh +force_install_dir ${SRCDS_DIR} +login anonymous +app_update 740 validate +quit || true

# Install Metamod (stable)
RUN wget -qO /tmp/mmsource.tar.gz "${MM_DOWNLOAD_URL}" \
  && mkdir -p /tmp/mmsource \
  && tar -xzf /tmp/mmsource.tar.gz -C /tmp/mmsource --strip-components=1 \
  && cp -r /tmp/mmsource/* ${SRCDS_DIR}/

# Install Sourcemod (stable)
RUN wget -qO /tmp/sourcemod.tar.gz "${SM_DOWNLOAD_URL}" \
  && mkdir -p /tmp/sourcemod \
  && tar -xzf /tmp/sourcemod.tar.gz -C /tmp/sourcemod --strip-components=1 \
  && cp -r /tmp/sourcemod/* ${SRCDS_DIR}/

# Copy configs, plugins and scripts
COPY ./cfg ${SRCDS_DIR}/csgo/cfg
COPY ./addons ${SRCDS_DIR}/addons
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Compile SourcePawn plugins
RUN if [ -d ${SRCDS_DIR}/addons/sourcemod/scripting ]; then \
  for f in ${SRCDS_DIR}/addons/sourcemod/scripting/*.sp; do \
  if [ -f "$f" ]; then \
  ${SRCDS_DIR}/addons/sourcemod/scripting/spcomp "$f" \
  -o ${SRCDS_DIR}/addons/sourcemod/plugins/$(basename "$f" .sp).smx || true; \
  fi; \
  done; \
  fi

# Expose ports
EXPOSE 27015/udp 27015/tcp 27020/udp

ENTRYPOINT ["/entrypoint.sh"]
