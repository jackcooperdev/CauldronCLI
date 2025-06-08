import {sendToServer} from "../utils/apiCommunication.js";
import {cauldronLogger} from "@jackcooperdev/cauldronengine/logger";
import path from "path";
import {getEnginePath} from "../utils/enviromentManager.js";
import fs from "fs";


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



export  { downloadProfiles,getProfiles };