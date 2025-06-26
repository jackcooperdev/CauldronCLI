const qs = require('qs');
const fetch = require('node-fetch');
const { jwtDecode } = require('jwt-decode');

const AUTH0_CLIENT = 'nxoRS1sbJ0XqglOzlya6vIszrHUpkJum';
const keytar = require('../utils/storageManager.js'); // This was a namespace import, so it becomes a direct require
const os = require('os');
const { grabServerAddress } = require('../utils/enviromentManager.js');
const { exec } = require("child_process");
const ora = require("ora-classic");
const { initializeCauldron } = require("./system.js");
const { cauldronLogger } = require('@jackcooperdev/cauldronengine/logger');

const keytarAccount = os.userInfo().username;

async function startAuthFlow() {
    let main_data = qs.stringify({
        'client_id': AUTH0_CLIENT,
        'scope': 'openid profile email offline_access',
        'audience': 'https://api.cauldronmc.com'
    });

    return new Promise(async (resolve, reject) => {
        if ((await keytar.getPassword('cauldroncli', keytarAccount)) != null) {
            try {
                const response = await refresh();
                if (!response.ok) {
                    let config = {
                        method: 'post',
                        maxBodyLength: Infinity,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: main_data
                    };
                    try {
                        const response = await fetch("https://cauldronmc.uk.auth0.com/oauth/device/code", config);
                        resolve({login_needed: true, data: await response.json()});
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    resolve({login_needed: false, data: await response.json()});
                }
            } catch (e) {
                reject(e)
            }

        } else {
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: main_data
            };
            try {
                const response = await fetch("https://cauldronmc.uk.auth0.com/oauth/device/code", config);
                resolve({login_needed: true, data: await response.json()});
            } catch (e) {
                reject(e);
            }
        }
    });
}

async function waitForComplete(device_code) {
    let data = qs.stringify({
        'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
        'device_code': device_code,
        'client_id': AUTH0_CLIENT
    });

    return new Promise(async (resolve, reject) => {
        let config1 = {
            method: 'post',
            maxBodyLength: Infinity,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: data
        };
        const tryAuth = setInterval(async function () {
            try {
                const response = await fetch("https://cauldronmc.uk.auth0.com/oauth/token", config1);
                if (response.ok) {
                    clearInterval(tryAuth);
                    let responseData = await response.json();
                    // noinspection JSIgnoredPromiseFromCall,ES6MissingAwait
                    await keytar.setPassword('cauldroncli', keytarAccount, responseData.refresh_token);
                    resolve(responseData);
                }
            } catch (e) {
                reject(e);
                //Suppress Error
            }

        }, 5000);
    })
}

async function performLoginFlow(isWS) {
    return new Promise(async (resolve, reject) => {
        try {
            const AUTH_DATA = await startAuthFlow();
            console.log('performed')
            if (AUTH_DATA.login_needed) {
                if (!isWS) {
                    let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                    exec(start + ' ' + AUTH_DATA.data.verification_uri_complete);
                    console.log(`🚨 Your Code is ${AUTH_DATA.data.user_code}. Please Ensure it matches the one displayed in browser`);
                    console.log(`Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.verification_uri_complete}`)
                    const spinner = ora(`Waiting For Login...`).start();
                    await waitForComplete(AUTH_DATA.data.device_code);
                    spinner.succeed(" Done!")
                } else {
                    console.log(AUTH_DATA.data);
                }

            }
            if (!isWS) {
                const uData = await grabUserInfo();
                console.log(`👋 Hello ${uData.name} (${uData.email}) You Are Logged Into CauldronAPI`);
                await initializeCauldron();
            }

        } catch (e) {

            cauldronLogger.error('⚠️ An Unexpected error occurred. Please try again later.');
            cauldronLogger.error(e)
        }
    })

}

async function grabUserInfo() {
    return new Promise(async (resolve) => {
        try {
            const accessToken = await grabAccessToken();
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            };

            const response = await fetch("https://cauldronmc.uk.auth0.com/userinfo", config);
            resolve(response.json());
        } catch (e) {
            resolve(false);
        }
    })
}

async function grabAccessToken() {
    return new Promise(async (resolve, reject) => {
        try {
            // Check For Access Token in Cred Manager
            if ((await keytar.getPassword('cauldronapi', keytarAccount)) != null) {
                // In cred manager
                let found_access_token = await keytar.getPassword('cauldronapi', keytarAccount);
                let decryptedKey = jwtDecode(found_access_token);


                let currentTime = Math.floor(Date.now() / 1000);

                if ((decryptedKey.exp - currentTime) > 1000) {
                    resolve(found_access_token);
                    return;
                }
            }
            // Check For Refresh Token
            if ((await keytar.getPassword('cauldroncli', keytarAccount)) === null) {
                console.log(keytarAccount)
                console.log(`🚨 You have not logged in please log in using the login command!`)
                process.exit(1);
            }
            const refresh_response = await refresh();
            if (refresh_response.ok) {
                let refreshJSON = await refresh_response.json();
                let access_token = refreshJSON.access_token;
                // noinspection ES6MissingAwait
                keytar.setPassword('cauldronapi', keytarAccount, access_token);
                resolve(access_token);
            } else {
                reject(refresh_response.error);
            }
        } catch (e) {
            reject(e);
        }
    });
}


async function refresh() {
    return new Promise(async (resolve, reject) => {
        try {
            let refresh = await keytar.getPassword('cauldroncli', keytarAccount);
            let data = JSON.stringify({
                token: refresh,
            });
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data
            };
            const response = await fetch(`${grabServerAddress(true)}admin/refresh_cli`, config);
            resolve(response);
        } catch (e) {
            console.log(e)
            reject(e);
        }
    })

}

function logout() {
    return new Promise(async () => {
        if ((await keytar.getPassword('cauldroncli', keytarAccount)) != null) {
            // noinspection ES6MissingAwait
            keytar.deletePassword('cauldroncli', keytarAccount);
            // noinspection ES6MissingAwait
            keytar.deletePassword('cauldronapi', keytarAccount);
            console.log(`👋 Logged Out`)
        } else {
            console.log('⚠️ You Are not Logged In')
        }
    });


}


module.exports = {startAuthFlow, waitForComplete, grabUserInfo, logout, grabAccessToken, performLoginFlow};