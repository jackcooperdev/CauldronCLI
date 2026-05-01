// Environment Manager
const path = require('path');

const fs = require('fs');
const os = require('node:os');
const { grabPath, getOperatingSystem } = require('@jackcooperdev/cauldronengine/compat');

// Default Values

// API Locations

let LOCAL_ADDRESS = "localhost:3000"
let PROD_ADDRESS = "api.cauldronmc.com";

let LOCAL_PROTOCOL = "http"

let RESOURCE_SERVER = "https://resources.cauldronmc.com";

let AUTH_SERVER = "https://lunaria-staging.lunariatech.co.uk";

let DEVELOPMENT_MODE = false;

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
    RESOURCE_SERVER:RESOURCE_SERVER,
    AUTH_SERVER:AUTH_SERVER,
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
    RESOURCE_SERVER = admin_file.RESOURCE_SERVER;
    process.env.CAULDRON_PATH = admin_file.CAULDRON_PATH;
    AUTH_SERVER = admin_file.AUTH_SERVER;
    process.env.RESOURCE_SERVER = admin_file.RESOURCE_SERVER;
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

function grabAuthServer() {
    return AUTH_SERVER;
}


function grabPackwizLocation() {
    let fileName = 'packwiz';
    if (CURRENT_OPERATING_SYSTEM === 'windows') {
        fileName += '.exe';
    }
    return path.join(CAULDRON_PATH,'config', 'packwiz', fileName);

}

function getEnginePath() {
    return CAULDRON_PATH;
}

function getResourcePath() {
    return RESOURCE_SERVER
}


module.exports = {grabServerAddress, DEVELOPMENT_MODE, grabPackwizLocation, getEnginePath, getResourcePath, grabAuthServer};