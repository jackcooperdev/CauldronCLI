import {getEnginePath} from '../utils/enviromentManager.js';
import {getOperatingSystem} from '@jackcooperdev/cauldronengine/compat';
import {checkJVM} from '@jackcooperdev/cauldronengine/jvm';
import {cauldronLogger} from '@jackcooperdev/cauldronengine/logger';
import {getPackwizJVM} from '@jackcooperdev/cauldronengine/manifest';
import {verifyInstallation} from '@jackcooperdev/cauldronengine/queue';

import ora from 'ora';
import {join} from 'node:path';
import path from 'path';
import shelljs from 'shelljs';
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
            origin: `${FILE_SERVER}/packwiz/${CURRENT_OPERATING_SYSTEM}${extension}`,
            destination: join(CAULDRON_PATH, 'packwiz'),
            sha1: 'NONE',
            fileName: fileName
        },
        {
            origin: `${FILE_SERVER}/packwiz/packwiz-installer-bootstrap.jar`,
            destination: join(CAULDRON_PATH, 'packwiz'),
            sha1: 'c78e76a8655157f65caff298bc0d022f9a93bd57',
            fileName: 'packwiz-installer-bootstrap.jar'
        }
    ];
    const spinner = ora(`Downloading Packwiz...`).start();
    await verifyInstallation(downloadQueue);
    spinner.succeed(`Retrieved Packwiz`);
    if (CURRENT_OPERATING_SYSTEM === 'linux') {
        await shelljs.chmod('+x', join(CAULDRON_PATH, 'packwiz', fileName));
    }

}

// initializeCauldron()
// Creates folder structure and installs vital files

async function initializeCauldron() {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(CAULDRON_PATH)) {
            fs.mkdirSync(CAULDRON_PATH);
        }

        // Create folders and files
        if (!fs.existsSync(path.join(CAULDRON_PATH, 'profiles.json'))) {
            fs.writeFileSync(path.join(CAULDRON_PATH, 'profiles.json'), "{}");
        }
        if (!fs.existsSync(path.join(CAULDRON_PATH, 'offline-versions.json'))) {
            let offlineTemplate = {
                "versions": {},
                "configs": {}
            }
            fs.writeFileSync(path.join(CAULDRON_PATH, 'offline-versions.json'), JSON.stringify(offlineTemplate));
        }
        if (!fs.existsSync(path.join(CAULDRON_PATH, 'modpacks'))) {
            fs.mkdirSync(path.join(CAULDRON_PATH, 'modpacks'));
        }

        try {
            if (!fs.existsSync(path.join(CAULDRON_PATH, 'install'))) {
                if (await checkInternet()) {
                    await downloadJVMInBackground();
                    await downloadPackWizInBackground();
                    fs.writeFileSync(path.join(CAULDRON_PATH, 'install'), Date.now().toString());
                } else {
                    process.exit(0);
                }

            } else {
                if (await checkInternet()) {
                    await downloadJVMInBackground()
                    await downloadPackWizInBackground()

                }
            }

            // if (mode === 0) {
            //     // Refresh MC Accounts
            //     let forceRefresh = true;
            //     if (DEVELOPMENT_MODE) {
            //         forceRefresh = false;
            //     }
            //     refreshAccounts(forceRefresh).then(function()  {
            //         cauldronLogger.debug("Refreshed Accounts")
            //     });
            //     setInterval(refreshAccounts, 1800000);
            //
            // }

            resolve(true);

        } catch (e) {
            reject(e);
        }
    });
}

async function resetCauldron() {
    await rimraf(path.join(CAULDRON_PATH));
}

export {initializeCauldron, resetCauldron};
