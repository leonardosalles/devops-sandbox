const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const AdmZip = require('adm-zip');
// Módulos nativos para manipular streams do fetch
const { Readable } = require('stream');
const { finished } = require('stream/promises');

// --- CONFIGURAÇÃO ---
const SRCDS_DIR = "/home/steam/cs2";
const ADDONS_DIR = path.join(SRCDS_DIR, "game/csgo/addons");
const GAMEINFO_FILE = path.join(SRCDS_DIR, "game/csgo/gameinfo.gi");
const PLUGINS_DIR = path.join(ADDONS_DIR, "counterstrikesharp/plugins");
const STEAMCMD_DIR = "/home/steam/steamcmd";
const LOG_FILE = "/tmp/cs2.log";

// Importa configurações locais (Seus JSONs)
const localQuakeConfig = require('./addons_configs/QuakeSounds.json');
const localSimpleAdminConfig = require('./addons_configs/SimpleAdmin.json');

// Variáveis de Ambiente
const STEAM_ADMIN_IDS = process.env.STEAM_ADMIN_IDS || "";
const API_URL = process.env.API_URL;
const SERVER_ID = process.env.SERVER_ID;
const RCON_PASS = process.env.RCON_PASSWORD || "changeme";
const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "CS2 Server";
const MAP = process.env.MAP || "de_inferno";
const GSLT = process.env.GSLT || "";

// --- FUNÇÕES AUXILIARES ---

// Substituição do Axios por Fetch Nativo + Streams
async function downloadFile(url, destPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const fileStream = fs.createWriteStream(destPath);
        // Converte o Web Stream do fetch para um Node Stream legível e faz o pipe
        const nodeStream = Readable.fromWeb(response.body);
        const stream = nodeStream.pipe(fileStream);
        
        // Aguarda o término da escrita
        await finished(stream);
    } catch (error) {
        console.error(`❌ Erro baixando ${url}:`, error.message);
        throw error;
    }
}

async function installPlugin(name, url, extractPath) {
    const zipPath = path.join('/tmp', `${name}.zip`);
    console.log(`[NODE] ⬇️ Baixando ${name}...`);
    
    try {
        await downloadFile(url, zipPath);
        console.log(`[NODE] 📦 Extraindo ${name}...`);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true); // overwrite = true
        fs.unlinkSync(zipPath);
        console.log(`[NODE] ✅ ${name} instalado.`);
    } catch (e) {
        console.error(`[NODE] ❌ Falha ao instalar ${name}:`, e.message);
    }
}

// --- ETAPAS DE INICIALIZAÇÃO ---

async function main() {
    console.log("========================================");
    console.log("   INICIANDO CS2 MANAGER (NODE.JS)      ");
    console.log("========================================");

    // 1. WORKSHOP DOWNLOAD & EXTRACT (Python Bridge)
    console.log("[BOOT] 📦 Baixando Assets da Workshop (Sons)...");
    try {
        // Roda SteamCMD como 'steam' user via gosu
        execSync(`gosu steam ${STEAMCMD_DIR}/steamcmd.sh +login anonymous +workshop_download_item 730 3461824328 +quit > /dev/null`, { stdio: 'inherit' });

        // Procura a pasta
        const findCmd = `find /home/steam -type d -name "3461824328" -print -quit`;
        const workshopPath = execSync(findCmd).toString().trim();

        if (workshopPath) {
            console.log(`[BOOT] 🎯 Assets encontrados em: ${workshopPath}`);
            
            const pythonScript = `
import vpk, os
src = "${workshopPath}"
dest = "${SRCDS_DIR}/game/csgo"
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
            console.log("[BOOT] ❌ Assets da Workshop não encontrados.");
        }
    } catch (e) {
        console.error("[BOOT] Erro no processo da Workshop:", e.message);
    }

    // 2. METAMOD
    console.log("[NODE] Verificando Metamod...");
    const MM_URL = "https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1319-linux.tar.gz";
    const mmZip = "/tmp/mm.tar.gz";
    if (!fs.existsSync(path.join(ADDONS_DIR, "metamod"))) {
        await downloadFile(MM_URL, mmZip);
        execSync(`tar -xzf ${mmZip} -C ${SRCDS_DIR}/game/csgo`);
        console.log("[NODE] Metamod instalado.");
    }

    // 3. GAMEINFO FIX
    if (fs.existsSync(GAMEINFO_FILE)) {
        let content = fs.readFileSync(GAMEINFO_FILE, 'utf8');
        content = content.replace(/Game\s+csgo\/addons\/quakesounds_assets/g, '');
        
        if (!content.includes("Game\tcsgo/addons/metamod")) {
            console.log("[NODE] Aplicando patch no gameinfo.gi...");
            content = content.replace(/Game\s+csgo\s*$/m, "			Game	csgo/addons/metamod\r\n			Game	csgo");
            fs.writeFileSync(GAMEINFO_FILE, content);
        }
    }

    // 4. MULTI ADDON MANAGER (MAM)
    await installPlugin("MultiAddonManager", "https://github.com/Source2ZE/MultiAddonManager/releases/download/v1.4.8/MultiAddonManager-v1.4.8-linux.tar.gz", `${SRCDS_DIR}/game/csgo`);
    
    const mamJsonPath = path.join(ADDONS_DIR, "multiaddonmanager/config.json");
    fs.mkdirSync(path.dirname(mamJsonPath), { recursive: true });
    fs.writeFileSync(mamJsonPath, JSON.stringify({ "WorkshopItems": ["3461824328"] }, null, 2));

    const mamCfgDir = path.join(SRCDS_DIR, "game/csgo/cfg/multiaddonmanager");
    fs.mkdirSync(mamCfgDir, { recursive: true });
    const mamCfgContent = `mm_extra_addons "3461824328"\nmm_client_extra_addons "3461824328"\nmm_extra_addons_timeout 10\nmm_addon_mount_download 1`;
    fs.writeFileSync(path.join(mamCfgDir, "multiaddonmanager.cfg"), mamCfgContent);

    // 5. COUNTERSTRIKESHARP
    await installPlugin("CounterStrikeSharp", "https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.347/counterstrikesharp-with-runtime-linux-1.0.347.zip", `${SRCDS_DIR}/game/csgo`);

    // 6. QUAKE SOUNDS
    await installPlugin("QuakeSounds", "https://github.com/Kandru/cs2-quake-sounds/releases/download/25.11.2/cs2-quake-sounds-release-25.11.2.zip", PLUGINS_DIR);
    
    const qsCfgPath = path.join(ADDONS_DIR, "counterstrikesharp/configs/plugins/CS2-QuakeSounds/QuakeSounds.json");
    fs.mkdirSync(path.dirname(qsCfgPath), { recursive: true });
    
    localQuakeConfig.global.ignore_bots = false;
    fs.writeFileSync(qsCfgPath, JSON.stringify(localQuakeConfig, null, 2));
    console.log("[NODE] 📄 Config do QuakeSounds gravada.");

    // 7. SIMPLE ADMIN & DEPS
    const gameRoot = `${SRCDS_DIR}/game/csgo`;
    await installPlugin("StatusBlocker", "https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/StatusBlocker-linux-1.7.8-beta-7.zip", ADDONS_DIR);
    await installPlugin("AnyBaseLibCS2", "https://github.com/NickFox007/AnyBaseLibCS2/releases/download/0.9.4/AnyBaseLib.zip", gameRoot);
    await installPlugin("PlayerSettings", "https://github.com/NickFox007/PlayerSettingsCS2/releases/download/0.9.3/PlayerSettings.zip", gameRoot);
    await installPlugin("MenuManagerCS2", "https://github.com/NickFox007/MenuManagerCS2/releases/download/1.4.1/MenuManager.zip", gameRoot);
    await installPlugin("SimpleAdmin", "https://github.com/daffyyyy/CS2-SimpleAdmin/releases/download/build-1.7.8-beta-7/CS2-SimpleAdmin-1.7.8-beta-7.zip", gameRoot);

    const saCfgPath = path.join(ADDONS_DIR, "counterstrikesharp/configs/plugins/CS2-SimpleAdmin/CS2-SimpleAdmin.json");
    fs.mkdirSync(path.dirname(saCfgPath), { recursive: true });
    
    if (!localSimpleAdminConfig.Database) {
        localSimpleAdminConfig.Database = { "Driver": "SQLite", "Database": "cs2_simpleadmin", "Prefix": "sa_" };
    }
    fs.writeFileSync(saCfgPath, JSON.stringify(localSimpleAdminConfig, null, 2));
    console.log("[NODE] 📄 Config do SimpleAdmin gravada.");

    // 8. ADMINS
    if (STEAM_ADMIN_IDS) {
        const adminIds = STEAM_ADMIN_IDS.split(',').map(id => id.trim()).filter(id => id);
        const adminJson = {};
        adminIds.forEach(id => {
            adminJson[`Admin_${id}`] = {
                "identity": id,
                "flags": ["@css/root", "@css/generic", "@css/cvar", "@css/rcon"]
            };
        });
        const adminPath = path.join(ADDONS_DIR, "counterstrikesharp/configs/admins.json");
        fs.mkdirSync(path.dirname(adminPath), { recursive: true });
        fs.writeFileSync(adminPath, JSON.stringify(adminJson, null, 2));
        console.log(`[NODE] 👑 ${adminIds.length} Admins configurados.`);
    }

    // 9. PERMISSÕES & LOG
    console.log("[NODE] 🔧 Ajustando permissões...");
    execSync(`chown -R steam:steam ${SRCDS_DIR}`);
    execSync(`touch ${LOG_FILE} && chown steam:steam ${LOG_FILE}`);

    // 10. STARTUP
    console.log("[NODE] 🚀 Iniciando CS2...");
    
    const serverArgs = [
        '-game', 'csgo',
        '-dedicated',
        '-insecure',
        '-usercon',
        '-console',
        '+sv_pure', '0',
        '+sv_setsteamaccount', GSLT,
        '+rcon_password', RCON_PASS,
        '+hostname', SERVER_HOSTNAME,
        '+map', MAP
    ];

    const logStream = fs.openSync(LOG_FILE, 'w');
    const server = spawn('gosu', ['steam', `${SRCDS_DIR}/game/bin/linuxsteamrt64/cs2`, ...serverArgs], {
        detached: false,
        stdio: ['ignore', logStream, logStream]
    });

    console.log(`[NODE] Servidor rodando com PID: ${server.pid}`);
    
    const tail = spawn('tail', ['-f', LOG_FILE]);
    tail.stdout.on('data', (data) => {
        const line = data.toString();
        process.stdout.write(line);

        if (line.includes("Server is hibernating") || line.includes("Spawn Server")) {
            if (API_URL && SERVER_ID) {
                console.log("[NODE] ✅ SERVIDOR PRONTO! Notificando backend...");
                // Notificação via fetch nativo
                fetch(`${API_URL}/servers/${SERVER_ID}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state: "RUNNING" })
                }).catch(err => console.error("Falha ao notificar backend:", err.message));
            }
        }
    });

    server.on('close', (code) => {
        console.log(`[NODE] Servidor fechou com código ${code}`);
        process.exit(code);
    });
}

main().catch(err => {
    console.error("[NODE] FATAL ERROR:", err);
    process.exit(1);
});
