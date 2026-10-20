// This Controller is in charge of launching the minecraft instance
// Dependencies

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url'); // This is an ESM utility, but the 'url' module exists in CJS

// Cauldron Imports
const { grabPath } = require('@jackcooperdev/cauldronengine/compat');

//const { getModList } = require('@jackcooperdev/packwiz_js');
//const { launchGame } = require('@jackcooperdev/cauldronengine/launcher');
const { whatIsThis, checkManifest } = require('@jackcooperdev/cauldronengine/manifest');
const { cauldronLogger } = require("@jackcooperdev/cauldronengine/logger");
const { startGame } = require('@jackcooperdev/cauldronengine/client');
// Internal Imports


// Set Constants
let CAULDRON_PATH = grabPath();

async function isDownloaded(version, loader) {
    return new Promise(async (resolve) => {
        if (version === 'release') {
            let vanillaManifest = await checkManifest('cauldron_version_manifest.json', 'https://launchermeta.mojang.com/mc/game/version_manifest.json', 'main');
            let identified = await whatIsThis(version, vanillaManifest);
            version = identified.version;
        }
        let combined = `${version}-${loader}`;
        if (!fs.existsSync(path.join(grabPath(), 'offline-versions.json'))) {
            fs.writeFileSync(path.join(grabPath(), 'offline-versions.json'), JSON.stringify({ versions: {} }));
        }
        let currentOfflineVersions = JSON.parse(fs.readFileSync(path.join(grabPath(), 'offline-versions.json')).toString());
        if (currentOfflineVersions.versions[combined]) {
            resolve(true);
        } else {
            resolve(false)
        }
    })
}

async function createMinecraftInstance(sessionID, authData, profileInfo, installOnly) {
    return new Promise(async (resolve, reject) => {
        try {
            CAULDRON_PATH = grabPath();
            if (!installOnly) {
                installOnly = false;
            }
            let overrides = profileInfo.overrides;
            // Create Session Folder
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'sessions'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'sessions'));
            }
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'sessions', sessionID))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'sessions', sessionID));
            }


            if (!overrides) {
                overrides = {};
            }
            if (!overrides['game']) {
                overrides['game'] = {};
            }
            if (!overrides['jvm']) {
                overrides['jvm'] = {};
            }

            // Set Required Overrides (Launcher Specific)

            overrides['jvm']['launcher_name'] = "CauldronMC";
            overrides['game']['version_type'] = "CauldronMC";
            overrides['game']['game_directory'] = path.join(CAULDRON_PATH, 'sessions', sessionID);

            // Apply Custom Arguments (custom_args.json)
            if (fs.existsSync(path.join(grabPath(), 'custom_args.json'))) {
                let customArgsFile = JSON.parse(fs.readFileSync(path.join(grabPath(), 'custom_args.json')).toString());
                if (customArgsFile.jvm) {
                    overrides['jvm'] = { ...overrides['jvm'], ...customArgsFile.jvm };
                }
                if (customArgsFile.game) {
                    overrides['game'] = { ...overrides['game'], ...customArgsFile.game };
                }
            }

            let installLock = true
            if (installOnly && !installLock && (await isDownloaded(profileInfo.options.version, profileInfo.options.loader))) {
                cauldronLogger.debug('Install Only Skipped')
                resolve('restored-from-offline')
            } else {
                //process.exit(0)
                const launchMinecraftSession = await startGame(profileInfo.options.version,profileInfo.options.loaderInfo,authData,profileInfo.overrides);
                //const launchMinecraftSession = await startGame(profileInfo.options.version, )
                resolve(launchMinecraftSession);
            }
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {  createMinecraftInstance };