import {getEnginePath, getResourcePath} from '../utils/enviromentManager.js';
import {getOperatingSystem} from '@jackcooperdev/cauldronengine/compat';
import {checkJVM} from '@jackcooperdev/cauldronengine/jvm';
import {cauldronLogger} from '@jackcooperdev/cauldronengine/logger';
import {getPackwizJVM} from '@jackcooperdev/cauldronengine/manifest';
import {verifyInstallation} from '@jackcooperdev/cauldronengine/queue';

import ora from 'ora';
import {join} from 'node:path';
import path from 'path';
import fs from 'fs';
import {checkInternet} from "@jackcooperdev/cauldronengine/online";
import {rimraf} from 'rimraf';
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
    let extension = '';

    if (CURRENT_OPERATING_SYSTEM === 'windows') {
        fileName += '.exe';
        extension = '.exe';
    }
    const FILE_SERVER = "await grabStaticFileServer();"
    let downloadQueue = [
        {
            origin: `${getResourcePath()}/packwiz/${CURRENT_OPERATING_SYSTEM}${extension}`,
            destination: join(CAULDRON_PATH,'config', 'packwiz'),
            sha1: 'NONE',
            fileName: fileName
        },
        {
            origin: `${getResourcePath()}/packwiz/packwiz-installer-bootstrap.jar`,
            destination: join(CAULDRON_PATH, 'config','packwiz'),
            sha1: 'c78e76a8655157f65caff298bc0d022f9a93bd57',
            fileName: 'packwiz-installer-bootstrap.jar'
        }
    ];
    const spinner = ora(`Downloading Packwiz...`).start();
    await verifyInstallation(downloadQueue);
    spinner.succeed(`Retrieved Packwiz`);
    if (CURRENT_OPERATING_SYSTEM === 'linux') {
        await fs.chmodSync(path.join(CAULDRON_PATH, 'config', 'packwiz', fileName), 0o755);
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

        // Check for jvm file
        if (!fs.existsSync(path.join(CAULDRON_PATH, "config/jvm_installed.json"))) {
            fs.writeFileSync(path.join(CAULDRON_PATH, "config/jvm_installed.json"), "{}");
        }

        // Check for a library installations file
        if (!fs.existsSync(path.join(CAULDRON_PATH, "config/libs_installed.json"))) {
            fs.writeFileSync(path.join(CAULDRON_PATH, "config/libs_installed.json"), "{}");
        }

        // Create folders and files
        if (!fs.existsSync(path.join(CAULDRON_PATH, 'config/profiles.json'))) {
            fs.writeFileSync(path.join(CAULDRON_PATH, 'config/profiles.json'), "{}");
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

async function resetCauldron() {
    await rimraf(path.join(CAULDRON_PATH));
}

export {initializeCauldron, resetCauldron};
