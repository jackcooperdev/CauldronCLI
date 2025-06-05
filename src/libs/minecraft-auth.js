// This Controller ensures that all the necessary files are present in order for Minecraft to launch.


// Dependencies
import Cryptr from 'cryptr';

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import ora from 'ora';

// Cauldron Imports
import {grabPath} from '@jackcooperdev/cauldronengine/compat';

import {checkInternet} from '@jackcooperdev/cauldronengine/online';
import {startAuthenticationFlow} from '@jackcooperdev/cauldronauthentication';

// Internal Dependencies
import {cauldronLogger} from '@jackcooperdev/cauldronengine/logger';


// Set Constants

import {verifyMinecraft} from '@jackcooperdev/cauldronauthentication/mas';
import {sendToServer} from '../utils/apiCommunication.js';
import {getEnginePath} from "../utils/enviromentManager.js";

const CAULDRON_PATH = getEnginePath();
// Not Secret just for added security
const cryptr = new Cryptr("yHfofXMDFWNaX4sXEe4P3RdYti4jaeLt");

async function grabAccountInfo(identifier) {
    let CAULDRON_PATH = grabPath();

    if (fs.existsSync(path.join(CAULDRON_PATH, 'cauldron_auth.json'))) {
        let auth = JSON.parse(fs.readFileSync(path.join(CAULDRON_PATH, 'cauldron_auth.json')).toString());
        if (auth.accounts[identifier]) {
            return auth.accounts[identifier];
        }
    }
}

function getAuthedUsers() {
    try {
        let authFile = JSON.parse(fs.readFileSync(path.join(CAULDRON_PATH, 'cauldron_auth.json')).toString());
        if (authFile) {
            let sessions = authFile.accounts;
            let loggedProfiles = [];
            for (let idx in sessions) {
                let obj = {
                    value: idx,
                    name: sessions[idx].profile.username,
                }
                loggedProfiles.push(obj)
            }
            return loggedProfiles;
        }
    } catch (err) {
        return [];
    }
}

async function processRefreshToken(identifier, forceRefresh) {
    return new Promise(async (resolve, reject) => {
        try {
            const accountInfo = await grabAccountInfo(identifier);
            if (await checkInternet()) {
                const verify = await verifyMinecraft(accountInfo.access_token);
                if (!verify || forceRefresh) {
                    if (accountInfo.refresh_token) {
                        let refreshed_token = await refreshToken(decrypt(accountInfo.refresh_token));
                        const startAuthentication = await startAuthenticationFlow(refreshed_token.access_token);
                        const currentProfiles = getAuthedUsers();

                        // Prevents Multiple Logins of the same user
                        for (let idx in currentProfiles) {
                            if (currentProfiles[idx].username) {
                                if (currentProfiles[idx].username === startAuthentication.profile.username) {
                                    await logoutUser(currentProfiles[idx].identifier);
                                    resolve(startAuthentication);
                                }
                            }
                        }
                        startAuthentication['refresh_token'] = encrypt(refreshed_token.refresh_token);
                        await writeToAccountsFile(identifier, startAuthentication);
                        resolve(startAuthentication);
                    } else {
                        reject('User Not Logged In');
                    }
                } else {
                    let returnBlock = {
                        "profile": {
                            "uuid": accountInfo.profile.uuid,
                            "username": accountInfo.profile.username
                        },
                        "xui": accountInfo.xui,
                        "access_token": accountInfo.access_token,
                        "user_id": accountInfo.user_id
                    };
                    resolve(returnBlock);
                }
            } else {
                let returnBlock = {
                    "profile": {
                        "uuid": accountInfo.profile.uuid,
                        "username": accountInfo.profile.username
                    },
                    "xui": accountInfo.xui,
                    "access_token": accountInfo.access_token,
                    "user_id": accountInfo.user_id
                };
                resolve(returnBlock);
            }

        } catch (e) {
            reject(e);
        }
    });
}

async function writeToAccountsFile(identifier, data, clear) {
    let defaultBody = {
        "accounts": {}
    };

    let currentFile;
    if (!fs.existsSync(path.join(CAULDRON_PATH, 'cauldron_auth.json'))) {
        fs.writeFileSync(path.join(CAULDRON_PATH, 'cauldron_auth.json'), JSON.stringify(defaultBody));
        currentFile = defaultBody;
        currentFile.accounts[identifier] = {...currentFile.accounts[identifier], ...data};
    } else {
        currentFile = JSON.parse(fs.readFileSync(path.join(CAULDRON_PATH, 'cauldron_auth.json')).toString());
        if (!clear) {
            currentFile.accounts[identifier] = {...currentFile.accounts[identifier], ...data};
        } else {
            delete currentFile.accounts[identifier];
        }
    }
    fs.writeFileSync(path.join(CAULDRON_PATH, 'cauldron_auth.json'), JSON.stringify(currentFile, null, 2));
}

async function logoutUser(identifier) {
    await writeToAccountsFile(identifier, {}, true);
    return true;
}

async function refreshAccounts(forceRefresh) {
    const CURRENT_EPOCH = Math.round(Date.now() / 1000);
    const CURRENT_PROFILES = getAuthedUsers();
    let C_IDENTIFIER;
    for (let idx in CURRENT_PROFILES) {
        try {
            if (!forceRefresh) {
                C_IDENTIFIER = CURRENT_PROFILES[idx].value;
                const C_DATA = await grabAccountInfo(C_IDENTIFIER);
                const C_EXP = jwt.decode(C_DATA.access_token).exp;
                let timeLeft = secondsToTime(C_EXP - CURRENT_EPOCH);
                if (timeLeft < 23) {
                    const spinner = ora(`Refreshing Account: ${CURRENT_PROFILES[idx].name}`).start();
                    await processRefreshToken(C_IDENTIFIER, true);
                    spinner.succeed(`Refreshed Account: ${CURRENT_PROFILES[idx].name}`);
                }
            } else {
                C_IDENTIFIER = CURRENT_PROFILES[idx].value;
                const spinner = ora(`Refreshing Account: ${CURRENT_PROFILES[idx].name}`).start();
                await processRefreshToken(C_IDENTIFIER, true);
                spinner.succeed(`Refreshed Account: ${CURRENT_PROFILES[idx].name}`);
            }
        } catch (e) {
            cauldronLogger.error(`Failed to Refresh Account: ${C_IDENTIFIER}`)
        }
    }
}

async function refreshAccount(identifier) {
    const CURRENT_EPOCH = Math.round(Date.now() / 1000);
    const CURRENT_PROFILES = getAuthedUsers();
    let C_IDENTIFIER;
    try {
        C_IDENTIFIER = identifier;
        const C_DATA = await grabAccountInfo(C_IDENTIFIER);
        const C_EXP = jwt.decode(C_DATA.access_token).exp;
        let timeLeft = secondsToTime(C_EXP - CURRENT_EPOCH);
        if (timeLeft < 23) {
            const spinner = ora(`Refreshing Account: ${CURRENT_PROFILES[idx].name}`).start();
            cauldronLogger.info(`Refreshing Account: ${CURRENT_PROFILES[idx].name}`);
            await processRefreshToken(C_IDENTIFIER, true);
            cauldronLogger.info(`Refreshed Account: ${CURRENT_PROFILES[idx].name}`);
            spinner.succeed(`Refreshed Account: ${CURRENT_PROFILES[idx].name}`);
        }
    } catch (e) {
        cauldronLogger.error(`Failed to Refresh Account: ${C_IDENTIFIER}`)
    }

}

// Tools

function encrypt(plaintext) {
    return cryptr.encrypt(plaintext);
}

function decrypt(text) {
    return cryptr.decrypt(text);
}

function secondsToTime(secs) {
    return Math.floor(secs / (60 * 60));
}

async function startMCAccount() {
    return new Promise(async (resolve, reject) => {
        try {
            let config = {
                method: 'get',
                url: 'microsoft/start_flow'
            };
            try {
                const response = await sendToServer(config, true);
                resolve({data: response});
            } catch (e) {
                reject(e);
            }
        } catch (e) {
            reject(e)
        }
    })
}

async function waitForComplete(device_code) {
    return new Promise(async (resolve, reject) => {
        let config1 = {
            method: 'get',
            url: 'microsoft/check?code=' + device_code,
        };
        const tryAuth = setInterval(async function () {
            try {
                const response = await sendToServer(config1, true);
                if (response.complete) {
                    clearInterval(tryAuth);
                    // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
                    resolve(response);
                }
            } catch (e) {
                reject(e);
                //Suppress Error
            }

        }, 5000);
    })
}

async function refreshToken(refresh_token) {
    return new Promise(async (resolve) => {

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `microsoft/refresh`,
            data: JSON.stringify({"refresh_token": refresh_token}),
        };

        try {
            const response = await sendToServer(config, true);
            resolve(response);
        } catch (err) {
            console.log(err)
            console.log(refresh_token)
            resolve(false);
        }
    });
}


export {
    startMCAccount,
    waitForComplete,
    refreshAccount,
    encrypt,
    writeToAccountsFile,
    processRefreshToken,
    logoutUser,
    refreshAccounts,
    grabAccountInfo,
    getAuthedUsers
};