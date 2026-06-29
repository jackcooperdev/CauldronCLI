const { getEnginePath, getResourcePath } = require('../utils/enviromentManager.js');
const { getOperatingSystem } = require('@jackcooperdev/cauldronengine/compat');
const { checkJVM } = require('@jackcooperdev/cauldronengine/jvm');
const { cauldronLogger } = require('@jackcooperdev/cauldronengine/logger');
const { getPackwizJVM } = require('@jackcooperdev/cauldronengine/manifest');
const { verifyInstallation } = require('@jackcooperdev/cauldronengine/queue');
const os = require('os');
const ora = require('ora-classic');
const { join } = require('node:path'); // Using 'node:path' is fine, but 'path' is also common
const path = require('path');
const fs = require('fs');
const { checkInternet } = require("@jackcooperdev/cauldronengine/online");
const { rimraf } = require('rimraf');
const { findPackwizArtifact } = require("../utils/packwizFinder");
// Set Constants

const CAULDRON_PATH = getEnginePath();
const CURRENT_OPERATING_SYSTEM = getOperatingSystem();

// downloadJVMInBackground
// Downloads Correct JVM for Packwiz to Function

async function downloadJVMInBackground() {
    try {
        const jManifest = await getPackwizJVM();
        const spinner = ora(`Downloading JVM: ${jManifest.jvmComp}...`).start();
        await checkJVM(jManifest.jvmComp, jManifest.jvmMani);
        spinner.succeed(`Retrieved JVM: ${jManifest.jvmComp}`);

    } catch (e) {
        cauldronLogger.error(e);
    }
}


// downloadPackWizInBackground
// Downloads Packwiz

async function downloadPackWizInBackground() {
    let fileName = 'packwiz';

    if (CURRENT_OPERATING_SYSTEM === 'windows') {
        fileName += '.exe';
    }
    let downloadQueue = [
        {
            origin: `${process.env.RESOURCE_SERVER}/packwiz/${os.platform()}/${os.arch()}`,
            destination: join(CAULDRON_PATH, 'config', 'packwiz'),
            sha1: 'NONE',
            fileName: fileName,
            forceUnzip: false
        },
        {
            origin: `${process.env.RESOURCE_SERVER}/packwiz/jar`,
            destination: join(CAULDRON_PATH, 'config', 'packwiz'),
            sha1: 'NONE',
            fileName: 'packwiz-installer-bootstrap.jar'
        },
        {
            origin: `${process.env.RESOURCE_SERVER}/packwiz/installer`,
            destination: join(CAULDRON_PATH, 'config', 'packwiz'),
            sha1: 'NONE',
            fileName: 'packwiz-installer.jar'
        }
    ];
    const spinner = ora(`Downloading Packwiz...`).start();
    await verifyInstallation(downloadQueue);
    spinner.succeed(`Retrieved Packwiz`);
    if (CURRENT_OPERATING_SYSTEM === 'linux' || CURRENT_OPERATING_SYSTEM === 'osx') {
        fs.chmodSync(path.join(CAULDRON_PATH, 'config', 'packwiz', fileName), 0o755);
    }

}

// initializeCauldron()
// Creates folder structure and installs vital files

async function initializeCauldron() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!fs.existsSync(CAULDRON_PATH)) {
                fs.mkdirSync(CAULDRON_PATH);
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'config'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'config'));
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, "config/assets_installed.json"))) {
                fs.writeFileSync(path.join(CAULDRON_PATH, "config/assets_installed.json"), "{}",);
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, "config/posts_completed.json"))) {
                fs.writeFileSync(path.join(CAULDRON_PATH, "config/posts_completed.json"), "{}",);
            }


            // Check for jvm file
            if (!fs.existsSync(path.join(CAULDRON_PATH, "config/jvm_installed.json"))) {
                fs.writeFileSync(path.join(CAULDRON_PATH, "config/jvm_installed.json"), "{}");
            }

            // Check for a library installations file
            if (!fs.existsSync(path.join(CAULDRON_PATH, "config/libs_installed.json"))) {
                fs.writeFileSync(path.join(CAULDRON_PATH, "config/libs_installed.json"), "{}");
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'config/offline-versions.json'))) {
                let offlineTemplate = {
                    "versions": {},
                    "configs": {}
                }
                fs.writeFileSync(path.join(CAULDRON_PATH, 'config/offline-versions.json'), JSON.stringify(offlineTemplate));
            }
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'modpacks'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'modpacks'));
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'modpacks_cache'))) {
                fs.mkdirSync(path.join(CAULDRON_PATH, 'modpacks_cache'));
            }

            if (!fs.existsSync(path.join(CAULDRON_PATH, 'install'))) {
                if (await checkInternet()) {
                    await downloadJVMInBackground();
                    await downloadPackWizInBackground();
                    fs.writeFileSync(path.join(CAULDRON_PATH, 'install'), Date.now().toString());
                } else {
                    process.exit(0);
                }
            }
            resolve(true);

        } catch (e) {
            console.log(e)
            reject(e);
        }
    });
}


async function checkForInstall() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'install'))) {
                resolve(false);
            } else {
                resolve(true);
            }
        } catch (e) {
            reject(e);
        }
    })
}

async function resetCauldron() {
    try {
        await rimraf(path.join(CAULDRON_PATH));
    } catch (e) {
        console.log(e)
    }

}

module.exports = { initializeCauldron, resetCauldron, checkForInstall };
