const path = require("path");
const { verifyInstallation } = require("@jackcooperdev/cauldronengine/queue");
const { getEnginePath, grabPackwizLocation } = require("./enviromentManager.js");
const { createPack, importFromCurseforge, importFromModrinth } = require("@jackcooperdev/packwiz_js");

const CAULDRON_PATH = getEnginePath();
let modpackProviders = {
    'curseforge': createCurseforgePack,
    'modrinth': createModrinthPack,
    'custom': createCustomModpack
}

async function createModpack(profileInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            let modpackProvider = profileInfo.modpackInfo;
            if (modpackProvider.provider) {
                await modpackProviders[modpackProvider.provider](profileInfo);
            }
            resolve(true);
        } catch (e) {
            reject(e)
        }
    })
}

async function createCurseforgePack(url, filename, sha1) {
    return new Promise(async (resolve, reject) => {
        try {
            let queue = [{
                "origin": url,
                "destination": path.join(CAULDRON_PATH, 'modpacks_cache'),
                "fileName": `${filename}.zip`,
                "sha1": sha1
            }]
            await verifyInstallation(queue, false);
            await importFromCurseforge(path.join(CAULDRON_PATH, 'modpacks_cache', `${filename}.zip`), path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation(), filename);
            resolve(true);
        } catch (e) {
            reject(e);
        }
    })
}

async function createCustomModpack(profileInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            let newPackData = {
                name: profileInfo.name,
                author: profileInfo.owner,
                ...profileInfo.options,
                minecraftVersion: profileInfo.options.version,
                mods: profileInfo.modpackInfo.mods
            }
         
            await createPack(newPackData, path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation());
            resolve(true);
        } catch (e) {
            reject(e);
        }
    })
}

async function createModrinthPack(url, filename, sha1) {
    return new Promise(async (resolve, reject) => {
        try {
            let queue = [{
                "origin": url,
                "destination": path.join(CAULDRON_PATH, 'modpacks_cache'),
                "fileName": `${filename}.mrpack`,
                "sha1": sha1
            }]
            await verifyInstallation(queue, false);
            await importFromModrinth(path.join(CAULDRON_PATH, 'modpacks_cache', `${filename}.mrpack`), path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation(), filename);
            resolve(true);
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = { createModpack, createCurseforgePack, createModrinthPack };