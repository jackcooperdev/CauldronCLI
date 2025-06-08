// This Controller handles communication with the CauldronAPI


// Dependencies
import fetch from 'node-fetch';

import {cauldronLogger} from '@jackcooperdev/cauldronengine/logger';
import {grabServerAddress} from './enviromentManager.js';
import {grabAccessToken} from '../libs/authentication.js';

// Cauldron Imports
import {checkInternet} from '@jackcooperdev/cauldronengine/online';


// Set Constants


// Send to Server (Authenticates and sends a request to server)

/*
    Error Codes:
        1 - No Internet
        2 - Auth Issue
        3 - API Down
        4 - Other (Error in err)
*/

async function sendToServer(params, auth) {
    return new Promise(async (resolve, reject) => {
        let authData;
        try {
            if (!(await checkInternet())) {
                reject({errorCode: 1, data: params})
                return;
            }

            const {method, url, data, headers} = params;
            let defaultHeaders = {
                'Content-Type': 'application/json'
            }
            let newHeaders = {...headers, ...defaultHeaders};

            if (auth) {
                authData = await grabAccessToken();
                let authHeader = {'Authorization': 'Bearer ' + authData};
                newHeaders = {...newHeaders, ...authHeader};
            }
            let config = {
                method: method,
                headers: newHeaders,
                body: data,
                maxRedirects: 0,
                maxBodyLength: Infinity,
            };

            const response = await fetch(`${grabServerAddress(true)}${url}`, config);
            resolve(await response.json());
        } catch (err) {
            if (!err) {
                reject(false)
                return
            }
            if (err.status === 302) {
                reject({errorCode: 2, data: params, auth: authData});
                return;
            }
            if (err.code) {
                if (err.code === 'ECONNREFUSED' || err.code === 'ERR_BAD_RESPONSE') {
                    reject({errorCode: 3, data: params, auth: authData});
                    return;
                }
            }
            reject({errorCode: 4, data: params, auth: authData, err: err});
        }
    });
}

async function isAPIOnline() {
    let config = {
        method: 'get',
        url: 'ping'
    };
    try {
        const pingServer = await sendToServer(config, false);
        cauldronLogger.info("API Version: " + pingServer);
        return true;

    } catch (err) {
        return false;
    }

}


export {sendToServer, isAPIOnline};