const qs = require('qs');
const fetch = require('node-fetch');
const { jwtDecode } = require('jwt-decode');

const AUTH0_CLIENT = '69c1aba074d6ddf3a7467738';
const keytar = require('../utils/storageManager.js'); // This was a namespace import, so it becomes a direct require
    const os = require('os');
const { grabServerAddress } = require('../utils/enviromentManager.js');
const { exec } = require("child_process");
const ora = require("ora-classic");
const { initializeCauldron } = require("./system.js");
const { cauldronLogger } = require('@jackcooperdev/cauldronengine/logger');
const {grabAuthServer} = require("../utils/enviromentManager");

const keytarAccount = os.userInfo().username;


async function startAuthFlow() {
    let main_data = qs.stringify({
        'client_id': AUTH0_CLIENT,
        'scope': 'openid profile email',
        'audience': '69c1ab5f74d6ddf3a7467734'
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
                        const response = await fetch(`${grabAuthServer()}/api/oauth/device/code`, config);
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
                const response = await fetch(`${grabAuthServer()}/api/oauth/device/code`, config);
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
                const response = await fetch(`${grabAuthServer()}/api/oauth/authorize/exchange`, config1);
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

async function performLoginFlow(isHeadLess,loginCode) {
    return new Promise(async (resolve, reject) => {
        try {
            const AUTH_DATA = await startAuthFlow();
            console.log(AUTH_DATA);
            if (AUTH_DATA.login_needed) {
                if (!isHeadLess || isHeadLess && loginCode) {
                    if (!isHeadLess) {
                        let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                        exec(start + ' ' + AUTH_DATA.data.verification_uri_complete);
                        console.log(`🚨 Your Code is ${AUTH_DATA.data.user_code}. Please Ensure it matches the one displayed in browser`);
                        console.log(`Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.verification_uri_complete}`)
                        loginCode = AUTH_DATA.data.device_code
                    }
                    const spinner = ora(`Waiting For Login...`).start();
                    await waitForComplete(loginCode);
                    spinner.succeed(" Done!")
                    resolve(true)
                } else {
                    resolve(AUTH_DATA.data)
                }
            }
            if (!isHeadLess) {
                const uData = await grabUserInfo();
                console.log(`👋 Hello ${uData.name} (${uData.email}) You Are Logged Into CauldronAPI`);
                resolve(true);
            } else{
                resolve({message:'User is logged in'})
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
            resolve(jwtDecode(accessToken))
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
                console.log(`🚨 You have not logged in please log in using the login command!`)
                reject("user not logged in");
                return;

            }
            const refresh_response = await refresh();
            if (refresh_response.ok) {
                let refreshJSON = await refresh_response.json();
                let access_token = refreshJSON.access_token;
                await keytar.setPassword('cauldronapi', keytarAccount, access_token);
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
            let data = qs.stringify({
                grant_type:'refresh_token',
                client_id:AUTH0_CLIENT,
                refresh_token: refresh,
            });
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: data
            };
            /*const response = await fetch(`${grabServerAddress(true)}admin/refresh_cli`, config);*/
            const response = await fetch(`${grabAuthServer()}/api/oauth/authorize/exchange`, config);
            resolve(response);
        } catch (e) {
            console.log(e)
            reject(e);
        }
    })

}

function logout() {
    return new Promise(async (resolve) => {
        if ((await keytar.getPassword('cauldroncli', keytarAccount)) != null) {
            // noinspection ES6MissingAwait
            await keytar.deletePassword('cauldroncli', keytarAccount);
            // noinspection ES6MissingAwait
            await keytar.deletePassword('cauldronapi', keytarAccount);
            console.log(`👋 Logged Out`)
            resolve(true);
        } else {
            console.log('⚠️ You Are not Logged In')
            resolve(false);
        }
    });


}


module.exports = {startAuthFlow, waitForComplete, grabUserInfo, logout, grabAccessToken, performLoginFlow};