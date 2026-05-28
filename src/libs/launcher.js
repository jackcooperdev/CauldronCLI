// This Controller is in charge of launching the minecraft instance
// Dependencies

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url'); // This is an ESM utility, but the 'url' module exists in CJS

// Cauldron Imports
const { grabPath, getOperatingSystem} = require('@jackcooperdev/cauldronengine/compat');

const { getModList } = require('@jackcooperdev/packwiz_js');
const { launchGame } = require('@jackcooperdev/cauldronengine/launcher');
const { whatIsThis, checkManifest } = require('@jackcooperdev/cauldronengine/manifest');
const { cauldronLogger } = require("@jackcooperdev/cauldronengine/logger");
// Internal Imports


// Set Constants
const CAULDRON_PATH = grabPath();

async function isDownloaded(version, loader) {
    return new Promise(async (resolve) => {
        if (version === 'release') {
            let vanillaManifest = await checkManifest('cauldron_version_manifest.json', 'https://launchermeta.mojang.com/mc/game/version_manifest.json', 'main');
            let identified = await whatIsThis(version, vanillaManifest);
            version = identified.version;
        }
        let combined = `${version}-${loader}`;
        if (!fs.existsSync(path.join(grabPath(), 'offline-versions.json'))) {
            fs.writeFileSync(path.join(grabPath(), 'offline-versions.json'),JSON.stringify({versions:{}}));
        }
        let currentOfflineVersions = JSON.parse(fs.readFileSync(path.join(grabPath(), 'offline-versions.json')).toString());
        if (currentOfflineVersions.versions[combined]) {
            resolve(true);
        } else {
            resolve(false)
        }
    })
}

async function launchMinecraft(sessionID, authData, profileInfo, installOnly) {
    return new Promise(async (resolve, reject) => {
        try {

            if (!installOnly) {
                installOnly = false;
            }

            let overrides = profileInfo.overides;
            // Create Session Folder
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'sessions'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'sessions'));
            }
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'sessions',sessionID))) {
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
                    overrides['jvm'] = {...overrides['jvm'], ...customArgsFile.jvm};
                }
                if (customArgsFile.game) {
                    overrides['game'] = {...overrides['game'], ...customArgsFile.game};
                }
            }


            // Check For Modpacks

            if (profileInfo.isModded) {
                let modpackPath = path.join(CAULDRON_PATH, 'modpacks', `${sessionID}_pack`, 'mods');
                console.log(modpackPath);
                if (fs.existsSync(modpackPath)) {
                    if (fs.existsSync(path.join(CAULDRON_PATH, 'sessions', sessionID, 'mods'))) {

                        let modList = await getModList(path.join(modpackPath, '../'));
                        let unfilteredModList = fs.readdirSync(path.join(CAULDRON_PATH, 'sessions', sessionID, 'mods'));
                        let filteredModList = [];

                        for (let idx in unfilteredModList) {
                            if (unfilteredModList[idx].includes('.jar')) {
                                filteredModList.push(unfilteredModList[idx]);
                            }
                        }
                        if (!compareArrays(modList, filteredModList)) {
                            await installMods(sessionID);
                        }
                    } else {
                        await installMods(sessionID);
                    }
                } else {
                    if (fs.existsSync(path.join(modpackPath, '../'))) {
                        await installMods(sessionID);
                    } else {
                        reject('Modpack Declared But not found');
                    }
                }
            }
            let installLock = true
            if (installOnly && !installLock && (await isDownloaded(profileInfo.options.version, profileInfo.options.loader))) {
                cauldronLogger.debug('Install Only Skipped')
                resolve('restored-from-offline')
            } else {
                const launchMinecraftSession = await launchGame(profileInfo.options.version, installOnly, profileInfo.options.loader, profileInfo.options.lVersion, authData, overrides)
                if (installOnly && !(await isDownloaded(profileInfo.options.version, profileInfo.options.loader))) {
                    let currentOfflineVersions = JSON.parse(fs.readFileSync(path.join(grabPath(), 'offline-versions.json')).toString());
                    currentOfflineVersions['versions'][`${profileInfo.options.version}-${profileInfo.options.loader}`] = {
                        installed: true,
                        lastChecked: new Date().getTime()
                    };
                    fs.writeFileSync(path.join(grabPath(), 'offline-versions.json'), JSON.stringify(currentOfflineVersions));
                }
                resolve(launchMinecraftSession);
            }
        } catch (e) {
            reject(e);
        }
    });
}

function compareArrays(arr1, arr2) {
    // Check if the arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Sort both arrays for consistent comparison
    arr1.sort();
    arr2.sort();

    // Compare each element of the sorted arrays
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    // If all elements match, return true
    return true;
}


async function installMods(packID) {
    return new Promise(async (resolve) => {
        let JVM_INSTALL = path.join(CAULDRON_PATH, 'jvm', 'java-runtime-alpha', 'bin', 'java');
        if (getOperatingSystem() === 'osx') {
            JVM_INSTALL = path.join(CAULDRON_PATH, 'jvm', 'java-runtime-alpha','jre.bundle','Contents','Home','bin','java');
        }

        const PACKWIZ_INSTALL = path.join(CAULDRON_PATH, 'config','packwiz', 'packwiz-installer-bootstrap.jar');
        const PACK_PATH_RAW = path.join(CAULDRON_PATH, 'modpacks', `${packID}_pack`, 'pack.toml');
        const PACK_PATH = pathToFileURL(PACK_PATH_RAW).href ;
        const command = `-jar ${PACKWIZ_INSTALL} ${PACK_PATH}`;
        console.log(JVM_INSTALL)
        console.log(command);
        const child = spawn(JVM_INSTALL, command.split(" "), {cwd: path.join(CAULDRON_PATH, 'sessions', packID)});
        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`child process exited with code ${code}`);
                process.exit(code);
            } else {
                resolve(true);
            }
        });
    })
}


module.exports = {launchMinecraft};