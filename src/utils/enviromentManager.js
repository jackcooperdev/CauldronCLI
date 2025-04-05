// Environment Manager
const path = require('path');
const fs = require('fs');
const os = require("node:os");
const {cauldronLogger} = require("@jackcooperdev/cauldronengine/logger");
const {grabPath, getOperatingSystem} = require("@jackcooperdev/cauldronengine/compat");

// Default Values

// API Locations

let LOCAL_ADDRESS = "localhost:3000"
let PROD_ADDRESS = "api.cauldronapi.com";

let DEVELOPMENT_MODE = false;

let MODE = 0;
let FORCE_MODE = false;

// Check for Override File
let defaultFile = {
    LOCAL_ADDRESS: LOCAL_ADDRESS,
    PROD_ADDRESS: PROD_ADDRESS,
    DEVELOPMENT_MODE: DEVELOPMENT_MODE,
    FORCE_MODE: FORCE_MODE,
};

let CAULDRON_PATH = grabPath();
let CURRENT_OPERATING_SYSTEM = getOperatingSystem();

// Override Values
if (!fs.existsSync(path.join(os.homedir(), 'cauldroncli_admin.json'))) {
    fs.writeFileSync(path.join(os.homedir(), 'cauldroncli_admin.json'), JSON.stringify(defaultFile));
} else {
    let admin_file = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'cauldroncli_admin.json')).toString());
    LOCAL_ADDRESS = admin_file.LOCAL_ADDRESS;
    PROD_ADDRESS = admin_file.PROD_ADDRESS;
    DEVELOPMENT_MODE = admin_file.DEVELOPMENT_MODE;
    FORCE_MODE = admin_file.FORCE_MODE;
}


function grabServerAddress(includeProtocol) {
    if (DEVELOPMENT_MODE && includeProtocol) {
        // noinspection HttpUrlsUsage
        return `http://${LOCAL_ADDRESS}/`;
    } else if (DEVELOPMENT_MODE && !includeProtocol) {
        return `${LOCAL_ADDRESS}/`;
    }

    if (includeProtocol) {
        return `https://${PROD_ADDRESS}/`;
    } else {
        return `${PROD_ADDRESS}/`;
    }
}

function sendDebug(message) {
    if (DEVELOPMENT_MODE) {
        cauldronLogger.debug(message);
    }
}

function grabPackwizLocation() {
    let fileName = 'packwiz';
    if (CURRENT_OPERATING_SYSTEM === 'windows') {
        fileName += '.exe';
    }
    return path.join(CAULDRON_PATH,'packwiz',fileName);

}

module.exports = { grabServerAddress, DEVELOPMENT_MODE,  sendDebug, grabPackwizLocation };