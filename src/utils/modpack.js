const path = require("path");
const { verifyInstallation } = require("@jackcooperdev/cauldronengine/queue");

const { getEnginePath, grabPackwizLocation } = require("./enviromentManager.js");
const { createPack, importFromFolder } = require("@jackcooperdev/cmm/pack");
//const { createPack, importFromCurseforge, importFromModrinth } = require("@jackcooperdev/packwiz_js");
const fs = require('fs');
const { installMods } = require("@jackcooperdev/cmm/bootstrap");
const { getPackInfo } = require('@jackcooperdev/cmm/pack')

const CAULDRON_PATH = getEnginePath();



async function createModpack(type, payload) {
    return new Promise(async (resolve, reject) => {
        try {
            switch (type) {
                case 'custom':

                    await createPack(payload, path.join(CAULDRON_PATH, 'modpacks'));
                    resolve(true);
                    break;
                case 'premade':

                    let { url, sha1, name } = payload;
                    let queue = [{
                        "origin": url,
                        "destination": path.join(CAULDRON_PATH, 'modpacks_cache'),
                        "fileName": `${sha1}${path.extname(url)}`,
                        "sha1": sha1
                    }]
                    await verifyInstallation(queue, false);
                    let pData = await importFromFolder(path.join(CAULDRON_PATH, 'modpacks_cache', `${sha1}${path.extname(url)}`), path.join(CAULDRON_PATH, 'modpacks'), name)
                    resolve(pData)
                    break;
                default:
                    resolve(false);
            }
        } catch (e) {
            reject(e)
        }
    })
}

async function installModpack(packName) {
     return new Promise(async (resolve, reject) => {

        let packPath = path.join(CAULDRON_PATH,'modpacks',packName);
        if (!fs.existsSync(packPath)) {
            reject(false);
        };
        
        let destPath = path.join(CAULDRON_PATH,'sessions',packName)

        // await installMods(packPath,destPath)
        await installMods(packPath,destPath);

        let info = await getPackInfo(packPath)

        resolve(info)
     })
}



module.exports = { createModpack, installModpack };