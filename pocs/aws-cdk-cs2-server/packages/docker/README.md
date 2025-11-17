CS2 Modded Docker image (hybrid) - uses app 740 (CS:GO server files) with Metamod/Sourcemod and admin menu.

Build (on Mac M1/M2, force amd64):
  docker build --platform=linux/amd64 -t cs2-modded packages/docker

Run locally:
  docker run -d --name cs2 -p 27015:27015/tcp -p 27015:27015/udp -p 27020:27020/udp \
    -e GSLT=YOUR_GSLT -e RCON_PASSWORD=your_rcon_password cs2-modded

Admin menu:
  - Bind H opens admin menu (sm_adminmenu)
  - Menu allows: Kick bots, Restart, End warmup, Set money, Set rounds, Change mode (COMP/DM/CASUAL)

Notes:
 - The SourcePawn plugins (.sp) will be compiled during the Docker build using spcomp that ships with Sourcemod.
 - Precompile plugins locally if compilation fails for your target version and include .smx files in addons/sourcemod/plugins/
 - app 740 is used for the server files (CS:GO server). Keep using 740 until Valve publishes separate CS2 server appid.
