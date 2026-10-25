// Environment Manager
const path = require('path');

const fs = require('fs');
const os = require('node:os');
const { grabPath, getOperatingSystem } = require('@jackcooperdev/cauldronengine/compat');

// Default Values

let RESOURCE_SERVER = "https://resources.cauldronmc.com";

let FORCE_MODE = false;

let CAULDRON_PATH = grabPath();

let AUTO_UPDATE = true;

// Check for Override File
let defaultFile = {
    FORCE_MODE: FORCE_MODE,
    CAULDRON_PATH: CAULDRON_PATH,
    RESOURCE_SERVER:RESOURCE_SERVER,
    AUTO_UPDATE: AUTO_UPDATE,
};


let CURRENT_OPERATING_SYSTEM = getOperatingSystem();

// Override Values
if (!fs.existsSync(path.join(os.homedir(), 'cauldroncli_admin.json'))) {
    fs.writeFileSync(path.join(os.homedir(), 'cauldroncli_admin.json'), JSON.stringify(defaultFile));
} else {
    let admin_file = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'cauldroncli_admin.json')).toString());
    FORCE_MODE = admin_file.FORCE_MODE;
    CAULDRON_PATH = admin_file.CAULDRON_PATH;
    RESOURCE_SERVER = admin_file.RESOURCE_SERVER;
    AUTO_UPDATE = admin_file.AUTO_UPDATE ?? AUTO_UPDATE;
    process.env.CAULDRON_PATH = admin_file.CAULDRON_PATH;
    process.env.RESOURCE_SERVER = admin_file.RESOURCE_SERVER;
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

function getAutoUpdate() {
    return AUTO_UPDATE
}


module.exports = {grabPackwizLocation, getEnginePath, getResourcePath, getAutoUpdate};