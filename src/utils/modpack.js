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

async function createCurseforgePack(url,filename,sha1) {
    return new Promise(async (resolve, reject) => {
        try {
            let queue = [{
                "origin": url,
                "destination": path.join(CAULDRON_PATH, 'modpacks_cache'),
                "fileName": `${filename}.zip`,
                "sha1": sha1
            }]
            await verifyInstallation(queue,false);
            await importFromCurseforge(path.join(CAULDRON_PATH, 'modpacks_cache', `${filename}.zip`), path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation(),filename);
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
            console.log(newPackData);
            await createPack(newPackData, path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation());
            resolve(true);
        } catch (e) {
            reject(e);
        }
    })
}

async function createModrinthPack(profileInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            let queue = [{
                "origin": profileInfo.modpackInfo.source,
                "destination": path.join(CAULDRON_PATH, 'bin'),
                "fileName": `${profileInfo.modpackInfo.source.split("/")[profileInfo.modpackInfo.source.split("/").length - 1]}`,
                "sha1": "NONE"
            }]
            await verifyInstallation(queue, false);
            console.log('creating mr')
            await importFromModrinth(path.join(CAULDRON_PATH, 'bin', `${profileInfo.modpackInfo.source.split("/")[profileInfo.modpackInfo.source.split("/").length - 1]}`), path.join(CAULDRON_PATH, 'modpacks'), grabPackwizLocation(), profileInfo._id);
            resolve(true);
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {createModpack, createCurseforgePack};