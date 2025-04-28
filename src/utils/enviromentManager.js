// Environment Manager
import path from 'path';

import fs from 'fs';
import os from 'node:os';
import {cauldronLogger} from '@jackcooperdev/cauldronengine/logger';
import {grabPath, getOperatingSystem} from '@jackcooperdev/cauldronengine/compat';

// Default Values

// API Locations

let LOCAL_ADDRESS = "localhost:3000"
let PROD_ADDRESS = "api.cauldronapi.com";

let LOCAL_PROTOCOL = "http"

let DEVELOPMENT_MODE = false;

let MODE = 0;
let FORCE_MODE = false;

let CAULDRON_PATH = grabPath();

// Check for Override File
let defaultFile = {
    LOCAL_ADDRESS: LOCAL_ADDRESS,
    PROD_ADDRESS: PROD_ADDRESS,
    DEVELOPMENT_MODE: DEVELOPMENT_MODE,
    FORCE_MODE: FORCE_MODE,
    CAULDRON_PATH: CAULDRON_PATH,
    LOCAL_PROTOCOL: LOCAL_PROTOCOL,
};


let CURRENT_OPERATING_SYSTEM = getOperatingSystem();

// Override Values
if (!fs.existsSync(path.join(os.homedir(), 'cauldroncli_admin.json'))) {
    fs.writeFileSync(path.join(os.homedir(), 'cauldroncli_admin.json'), JSON.stringify(defaultFile));
} else {
    let admin_file = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'cauldroncli_admin.json')).toString());
    LOCAL_ADDRESS = admin_file.LOCAL_ADDRESS;
    PROD_ADDRESS = admin_file.PROD_ADDRESS;
    DEVELOPMENT_MODE = admin_file.DEVELOPMENT_MODE;
    LOCAL_PROTOCOL = admin_file.LOCAL_PROTOCOL;
    FORCE_MODE = admin_file.FORCE_MODE;
    CAULDRON_PATH = admin_file.CAULDRON_PATH;
    process.env.CAULDRON_PATH = admin_file.CAULDRON_PATH;
}


function grabServerAddress(includeProtocol) {
    if (DEVELOPMENT_MODE && includeProtocol) {
        // noinspection HttpUrlsUsage
        return `${LOCAL_PROTOCOL}://${LOCAL_ADDRESS}/`;
    } else if (DEVELOPMENT_MODE && !includeProtocol) {
        return `${LOCAL_ADDRESS}/`;
    }

    if (includeProtocol) {
        return `https://${PROD_ADDRESS}/`;
    } else {
        return `${PROD_ADDRESS}/`;
    }
}


function grabPackwizLocation() {
    let fileName = 'packwiz';
    if (CURRENT_OPERATING_SYSTEM === 'windows') {
        fileName += '.exe';
    }
    return path.join(CAULDRON_PATH, 'packwiz', fileName);

}

function getEnginePath() {
    return CAULDRON_PATH;
}


export {grabServerAddress, DEVELOPMENT_MODE, grabPackwizLocation, getEnginePath};