const { getEnginePath } = require('../utils/enviromentManager.js');
const { getOperatingSystem } = require('@jackcooperdev/cauldronengine/compat');

const path = require('path');
const fs = require('fs');
const { rimraf, rimrafSync } = require('rimraf');
const { grabCE } = require('@jackcooperdev/cauldronengine/manifest');

// Set Constants

const CAULDRON_PATH = getEnginePath();



// initializeCauldron()
// Creates folder structure and installs vital files

async function initializeCauldron() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!fs.existsSync(CAULDRON_PATH)) {
                fs.mkdirSync(CAULDRON_PATH);
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'modpacks'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'modpacks'));
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'modpacks_cache'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'modpacks_cache'));
            }
            // Purge PWiz From Installation
            if (fs.existsSync(path.join(CAULDRON_PATH, 'install'))) {
                rimrafSync(path.join(CAULDRON_PATH, 'config', 'packwiz'))
                rimrafSync(path.join(CAULDRON_PATH, 'install'))
            }
            resolve(true);

        } catch (e) {
            console.log(e)
            reject(e);
        }
    });
}

async function listInstalledVersions() {
    let versionPath = path.join(CAULDRON_PATH, 'versions');
    let versions = []
    if (fs.existsSync(versionPath)) {
        let versionFolders = fs.readdirSync(versionPath);
        versionFolders = versionFolders.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
        for (let version of versionFolders) {
            let versionData = {
                loader: 'vanilla',
                version: '',
                loaderVersion: '',
            }
            let temp = path.join(versionPath, version);
            let expectedVersionCE = path.join(temp, 'version.ce');
            if (fs.existsSync(expectedVersionCE)) {

                let maniData = await grabCE(expectedVersionCE);
                if (maniData) {
                    versionData.loader = maniData.loader;
                    versionData.version = maniData.vanillaVersion,
                        versionData.loaderVersion = maniData.lv;
                    versions.push(versionData)
                }
            }
        }
    }
    return versions
}

async function resetCauldron() {
    try {
        await rimraf(path.join(CAULDRON_PATH));
    } catch (e) {
        console.log(e)
    }

}

module.exports = { initializeCauldron, resetCauldron, listInstalledVersions };
