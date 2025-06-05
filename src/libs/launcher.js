// This Controller is in charge of launching the minecraft instance
// Dependencies
import shell from 'shelljs';

import path from 'path';
import fs from 'fs';
import {spawn} from 'child_process';

// Cauldron Imports
import {grabPath} from '@jackcooperdev/cauldronengine/compat';

import {getModList} from '@jackcooperdev/packwiz_js';
import {grabAccountInfo} from './minecraft-auth.js';
import {launchGame} from '@jackcooperdev/cauldronengine/launcher';
import {whatIsThis, checkManifest} from '@jackcooperdev/cauldronengine/manifest';
import {cauldronLogger} from "@jackcooperdev/cauldronengine/logger";
// Internal Imports


// Set Constants
const CAULDRON_PATH = grabPath();

async function isDownloaded(version, loader) {
    return new Promise(async (resolve) => {
        if (version === 'release') {
            let vanillaManifest = await checkManifest('cauldron_version_manifest.json', 'https://launchermeta.mojang.com/mc/game/version_manifest.json', 'main');
            let identified = await whatIsThis(version, loader, '', vanillaManifest, undefined);
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

async function launchMinecraft(sessionID, mcAccountID, profileInfo, installOnly) {
    return new Promise(async (resolve, reject) => {
        try {
            let authData;
            if (!installOnly) {
                authData = await grabAccountInfo(mcAccountID);
                installOnly = false;
            }

            let overrides = profileInfo.overides;

            // Create Session Folder
            shell.mkdir('-p', path.join(CAULDRON_PATH, 'sessions', sessionID));

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
                let modpackPath = path.join(CAULDRON_PATH, 'modpacks', profileInfo._id, 'mods');

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
                            await installMods(profileInfo._id);
                        }
                    } else {
                        await installMods(profileInfo._id);
                    }
                } else {
                    if (fs.existsSync(path.join(modpackPath, '../'))) {
                        await installMods(profileInfo._id);
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
                const launchMinecraftSession = await launchGame(profileInfo.options.version, installOnly, profileInfo.options.loader, profileInfo.lVersion, authData, overrides)
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
        const JVM_INSTALL = path.join(CAULDRON_PATH, 'jvm', 'java-runtime-alpha', 'bin', 'java');
        const PACKWIZ_INSTALL = path.join(CAULDRON_PATH, 'packwiz', 'packwiz-installer-bootstrap.jar');
        const PACK_PATH = `http://localhost:8778/modpacks/${packID}/pack.toml`;
        const command = `-jar ${PACKWIZ_INSTALL} ${PACK_PATH}`;
        const child = spawn(JVM_INSTALL, command.split(" "), {cwd: path.join(CAULDRON_PATH, 'sessions', packID)});
        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`child process exited with code ${code}`);
            } else {
                resolve(true);
            }
        });
    })
}


export {launchMinecraft};