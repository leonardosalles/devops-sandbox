const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const AdmZip = require('adm-zip');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const PATHS = {
    SRCDS: "/home/steam/cs2",
    ADDONS: "/home/steam/cs2/game/csgo/addons",
    GAMEINFO: "/home/steam/cs2/game/csgo/gameinfo.gi",
    STEAMCMD: "/home/steam/steamcmd",
    LOG: "/tmp/cs2.log",
    CFG_SRC: path.join(__dirname, 'cfg', 'server.cfg')
};

PATHS.PLUGINS = path.join(PATHS.ADDONS, "counterstrikesharp/plugins");
PATHS.GAME_ROOT = path.join(PATHS.SRCDS, "game/csgo");

const DOWNLOAD_URLS = {
    METAMOD: "https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1319-linux.tar.gz",
    MAM: "https://github.com/Source2ZE/MultiAddonManager/releases/download/v1.4.8/MultiAddonManager-v1.4.8-linux.tar.gz",
    CSS: "https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.347/counterstrikesharp-with-runtime-linux-1.0.347.zip",
    QUAKE_SOUNDS: "https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip",
    SIMPLE_ADMIN_BUNDLE: {
        STATUS_BLOCKER: "https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/StatusBlocker-linux-1.7.8-beta-7.zip",
        ANYBASE: "https://github.com/NickFox007/AnyBaseLibCS2/releases/download/0.9.4/AnyBaseLib.zip",
        PLAYER_SETTINGS: "https://github.com/NickFox007/PlayerSettingsCS2/releases/download/0.9.3/PlayerSettings.zip",
        MENU_MANAGER: "https://github.com/NickFox007/MenuManagerCS2/releases/download/1.4.1/MenuManager.zip",
        SIMPLE_ADMIN: "https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/CS2-SimpleAdmin-1.7.8-beta-7.zip"
    }
};

const WORKSHOP_ID_QUAKE = "3461824328";

const localQuakeConfig = require('./addons_configs/QuakeSounds.json');
const localSimpleAdminConfig = require('./addons_configs/SimpleAdmin.json');

const ENV = {
    ADMIN_IDS: process.env.STEAM_ADMIN_IDS || "",
    API_URL: process.env.API_URL,
    SERVER_ID: process.env.SERVER_ID,
    RCON_PASS: process.env.RCON_PASSWORD || "changeme",
    HOSTNAME: process.env.SERVER_HOSTNAME || "CS2 Server",
    INITIAL_MAP: process.env.INITIAL_MAP || "de_inferno",
    GSLT: process.env.GSLT || ""
};

class ServerManager {
    constructor() {
        console.log("========================================");
        console.log("   STARTING CS2 MANAGER (NODE.JS)      ");
        console.log("========================================");
        this.printEnv();
    }

    printEnv() {
        console.log("--- ENVIRONMENT VARIABLES CHECK ---");
        console.log(`STEAM_ADMIN_IDS: ${ENV.ADMIN_IDS}`);
        console.log(`SERVER_HOSTNAME: ${ENV.HOSTNAME}`);
        console.log(`INITIAL_MAP: ${ENV.INITIAL_MAP}`);
        console.log(`API_URL: ${ENV.API_URL || 'NOT SET'}`);
        console.log(`GSLT: ${ENV.GSLT ? '****** (SET)' : 'NOT SET'}`);
        console.log("-----------------------------------");
    }

    async downloadFile(url, destPath) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const fileStream = fs.createWriteStream(destPath);
            await finished(Readable.fromWeb(response.body).pipe(fileStream));
        } catch (error) {
            console.error(`❌ Error downloading ${url}:`, error.message);
            throw error;
        }
    }

    async installPlugin(name, url, extractPath) {
        const isTarGz = url.endsWith('.tar.gz');
        const fileName = isTarGz ? `${name}.tar.gz` : `${name}.zip`;
        const filePath = path.join('/tmp', fileName);

        console.log(`[NODE] ⬇️ Downloading ${name}...`);
        try {
            await this.downloadFile(url, filePath);
            console.log(`[NODE] 📦 Extracting ${name}...`);

            if (isTarGz) {
                execSync(`tar -xzf ${filePath} -C ${extractPath}`);
            } else {
                const zip = new AdmZip(filePath);
                zip.extractAllTo(extractPath, true);
            }
            fs.unlinkSync(filePath);
            console.log(`[NODE] ✅ ${name} installed.`);
        } catch (e) {
            console.error(`[NODE] ❌ Failed to install ${name}:`, e.message);
        }
    }

    writeConfig(filePath, content) {
        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            const data = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
            fs.writeFileSync(filePath, data);
            console.log(`[NODE] 📄 Config saved: ${path.basename(filePath)}`);
        } catch (e) {
            console.error(`[NODE] ❌ Error writing config ${filePath}:`, e.message);
        }
    }

    async setupWorkshop() {
        console.log(`[BOOT] 📦 Downloading Workshop assets (${WORKSHOP_ID_QUAKE})...`);
        try {
            execSync(`gosu steam ${PATHS.STEAMCMD}/steamcmd.sh +login anonymous +workshop_download_item 730 ${WORKSHOP_ID_QUAKE} +quit > /dev/null`, { stdio: 'inherit' });

            const findCmd = `find /home/steam -type d -name "${WORKSHOP_ID_QUAKE}" -print -quit`;
            const workshopPath = execSync(findCmd).toString().trim();

            if (workshopPath) {
                console.log(`[BOOT] 🎯 Assets found at: ${workshopPath}`);
                const pythonScript = `
import vpk, os
src = "${workshopPath}"
dest = "${PATHS.GAME_ROOT}"
print(f"Scanning {src}...")
for root, dirs, files in os.walk(src):
    for file in files:
        if file.endswith("_dir.vpk"):
            vpk_path = os.path.join(root, file)
            print(f"Extracting {vpk_path}...")
            try:
                pak = vpk.open(vpk_path)
                for fp in pak:
                    clean_fp = fp.replace('\\\\', '/')
                    if clean_fp.startswith("csgo/"): clean_fp = clean_fp[5:]
                    elif clean_fp.startswith("/csgo/"): clean_fp = clean_fp[6:]
                    out = os.path.join(dest, clean_fp)
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    pak.get_file(fp).save(out)
                print("Extraction success.")
            except Exception as e:
                print(f"Error: {e}")
`;
                fs.writeFileSync('/tmp/extract.py', pythonScript);
                execSync('python3 /tmp/extract.py', { stdio: 'inherit' });
            } else {
                console.log("[BOOT] ❌ Workshop assets not found.");
            }
        } catch (e) {
            console.error("[BOOT] Error in Workshop process:", e.message);
        }
    }

    async setupMetamod() {
        console.log("[NODE] Checking Metamod...");
        if (!fs.existsSync(path.join(PATHS.ADDONS, "metamod"))) {
            await this.downloadFile(DOWNLOAD_URLS.METAMOD, "/tmp/mm.tar.gz");
            execSync(`tar -xzf /tmp/mm.tar.gz -C ${PATHS.GAME_ROOT}`);
            console.log("[NODE] Metamod installed.");
        }

        if (fs.existsSync(PATHS.GAMEINFO)) {
            let content = fs.readFileSync(PATHS.GAMEINFO, 'utf8');
            content = content.replace(/Game\s+csgo\/addons\/quakesounds_assets/g, '');
            if (!content.includes("Game\tcsgo/addons/metamod")) {
                console.log("[NODE] Applying patch to gameinfo.gi...");
                content = content.replace(/Game\s+csgo\s*$/m, "         Game    csgo/addons/metamod\r\n         Game    csgo");
                fs.writeFileSync(PATHS.GAMEINFO, content);
            }
        }
    }

    async setupMultiAddonManager() {
        await this.installPlugin("MultiAddonManager", DOWNLOAD_URLS.MAM, PATHS.GAME_ROOT);
        
        this.writeConfig(
            path.join(PATHS.ADDONS, "multiaddonmanager/config.json"), 
            { "WorkshopItems": [WORKSHOP_ID_QUAKE] }
        );

        const cfgContent = `mm_extra_addons "${WORKSHOP_ID_QUAKE}"\nmm_client_extra_addons "${WORKSHOP_ID_QUAKE}"\nmm_extra_addons_timeout 10\nmm_addon_mount_download 1`;
        this.writeConfig(path.join(PATHS.GAME_ROOT, "cfg/multiaddonmanager/multiaddonmanager.cfg"), cfgContent);
    }

    async setupCounterStrikeSharp() {
        await this.installPlugin("CounterStrikeSharp", DOWNLOAD_URLS.CSS, PATHS.GAME_ROOT);
    }

    async setupQuakeSounds() {
        await this.installPlugin("QuakeSounds", DOWNLOAD_URLS.QUAKE_SOUNDS, PATHS.PLUGINS);
        
        localQuakeConfig.global.ignore_bots = false;
        
        const configPath = path.join(PATHS.ADDONS, "counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json");
        this.writeConfig(configPath, localQuakeConfig);
    }

    async setupSimpleAdmin() {
        const deps = DOWNLOAD_URLS.SIMPLE_ADMIN_BUNDLE;
        
        await this.installPlugin("StatusBlocker", deps.STATUS_BLOCKER, PATHS.ADDONS);
        await this.installPlugin("AnyBaseLibCS2", deps.ANYBASE, PATHS.GAME_ROOT);
        await this.installPlugin("PlayerSettings", deps.PLAYER_SETTINGS, PATHS.GAME_ROOT);
        await this.installPlugin("MenuManagerCS2", deps.MENU_MANAGER, PATHS.GAME_ROOT);
        await this.installPlugin("SimpleAdmin", deps.SIMPLE_ADMIN, PATHS.GAME_ROOT);

        const configPath = path.join(PATHS.ADDONS, "counterstrikesharp/configs/plugins/CS2-SimpleAdmin/CS2-SimpleAdmin.json");
        
        if (!localSimpleAdminConfig.Database) {
            localSimpleAdminConfig.Database = { "Driver": "SQLite", "Database": "cs2_simpleadmin", "Prefix": "sa_" };
        }
        this.writeConfig(configPath, localSimpleAdminConfig);
    }

    configureAdmins() {
        if (!ENV.ADMIN_IDS) return;
        
        const adminIds = ENV.ADMIN_IDS.split(',').map(id => id.trim()).filter(id => id);
        const adminJson = {};
        adminIds.forEach(id => {
            adminJson[`Admin_${id}`] = {
                "identity": id,
                "flags": ["@css/root", "@css/generic", "@css/cvar", "@css/rcon"]
            };
        });
        
        const adminPath = path.join(PATHS.ADDONS, "counterstrikesharp/configs/admins.json");
        this.writeConfig(adminPath, adminJson);
        console.log(`[NODE] 👑 ${adminIds.length} Admins configured.`);
    }

    copyServerConfig() {
        const dest = path.join(PATHS.GAME_ROOT, "cfg/server.cfg");
        if (fs.existsSync(PATHS.CFG_SRC)) {
            fs.copyFileSync(PATHS.CFG_SRC, dest);
            console.log("[NODE] ✅ server.cfg copied.");
        }
    }

    fixPermissions() {
        console.log("[NODE] 🔧 Adjusting permissions...");
        execSync(`chown -R steam:steam ${PATHS.SRCDS}`);
        execSync(`touch ${PATHS.LOG} && chown steam:steam ${PATHS.LOG}`);
    }

    startServer() {
        console.log("[NODE] 🚀 Starting CS2...");
        
        const serverBin = path.join(PATHS.SRCDS, "game/bin/linuxsteamrt64");
        const csgoBin = path.join(PATHS.SRCDS, "game/csgo/bin/linuxsteamrt64");
        const steamCmdBin = path.join(PATHS.STEAMCMD, "linux64");
        
        const ldLibraryPath = `${serverBin}:${csgoBin}:${steamCmdBin}:${process.env.LD_LIBRARY_PATH || ''}`;
        
        const env = { ...process.env, LD_LIBRARY_PATH: ldLibraryPath };

        const serverArgs = [
            '-game', 'csgo',
            '-dedicated',
            '-insecure',
            '-usercon',
            '-console',
            '+sv_pure', '0',
            '+sv_setsteamaccount', ENV.GSLT,
            '+rcon_password', ENV.RCON_PASS,
            '+hostname', ENV.HOSTNAME,
            '+map', ENV.INITIAL_MAP
        ];

        const logStream = fs.openSync(PATHS.LOG, 'w');
        
        const executable = path.join(PATHS.SRCDS, "game/bin/linuxsteamrt64/cs2");

        const server = spawn('gosu', ['steam', executable, ...serverArgs], {
            detached: false,
            stdio: ['ignore', logStream, logStream],
            env: env
        });

        console.log(`[NODE] Server running with PID: ${server.pid}`);

        const tail = spawn('tail', ['-f', PATHS.LOG]);
        tail.stdout.on('data', (data) => {
            const line = data.toString();
            process.stdout.write(line);

            if (line.includes("Server is hibernating") || line.includes("Spawn Server")) {
                if (ENV.API_URL && ENV.SERVER_ID) {
                    console.log("[NODE] ✅ SERVER READY! Notifying backend...");
                    fetch(`${ENV.API_URL}/servers/${ENV.SERVER_ID}/status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ state: "RUNNING" })
                    }).catch(err => console.error("Failed to notify backend:", err.message));
                }
            }
        });

        server.on('close', (code, signal) => {
            console.log(`[NODE] Server closed with code ${code} and signal ${signal}`);
            process.exit(code || 1);
        });
    }

    async run() {
        fs.mkdirSync(PATHS.ADDONS, { recursive: true });

        await this.setupWorkshop();
        await this.setupMetamod();
        await this.setupMultiAddonManager();
        await this.setupCounterStrikeSharp();
        await this.setupQuakeSounds();
        await this.setupSimpleAdmin();
        
        this.configureAdmins();
        this.copyServerConfig();
        this.fixPermissions();
        
        this.startServer();
    }
}

const manager = new ServerManager();
manager.run().catch(err => {
    console.error("[NODE] FATAL ERROR:", err);
    process.exit(1);
});
