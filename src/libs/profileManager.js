const { sendToServer } = require("../utils/apiCommunication.js");
const { cauldronLogger } = require("@jackcooperdev/cauldronengine/logger");
const path = require("path");
const { getEnginePath } = require("../utils/enviromentManager.js");
const fs = require("fs");

async function downloadProfiles() {
    try {
        let config = {
            method:'get',
            url:'profile'
        }

        const profiles = await sendToServer(config,true);
        fs.writeFileSync(path.join(getEnginePath(),'config','profiles.json'), JSON.stringify(profiles,null,2));
    } catch (e) {
        if (e.errorCode === 3) {
            cauldronLogger.error("Could Not Reach API Was Unable to fetch profiles");
        }
        // TODO: Implement Offline Mode
    }

}

async function getProfiles() {
    return JSON.parse(fs.readFileSync(path.join(getEnginePath(), 'config', 'profiles.json')).toString());
}



module.exports =  { downloadProfiles,getProfiles };