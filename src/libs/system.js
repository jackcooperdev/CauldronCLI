const { getEnginePath } = require('../utils/enviromentManager.js');
const { getOperatingSystem } = require('@jackcooperdev/cauldronengine/compat');

const path = require('path');
const fs = require('fs');
const { rimraf, rimrafSync } = require('rimraf');

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
                rimrafSync(path.join(CAULDRON_PATH,'config','packwiz'))
                rimrafSync(path.join(CAULDRON_PATH,'install'))
            }
            resolve(true);

        } catch (e) {
            console.log(e)
            reject(e);
        }
    });
}

async function resetCauldron() {
    try {
        await rimraf(path.join(CAULDRON_PATH));
    } catch (e) {
        console.log(e)
    }

}

module.exports = { initializeCauldron, resetCauldron };
