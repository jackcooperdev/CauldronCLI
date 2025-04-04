const qs = require('qs');
const fetch = require("node-fetch");
const {jwtDecode} = require("jwt-decode");
const {encrypt} = require("aes256");
const AUTH0_CLIENT = 'nxoRS1sbJ0XqglOzlya6vIszrHUpkJum';
const keytar = require('keytar')
const os = require("os");
const keytarAccount = os.userInfo().username;

async function startAuthFlow() {
    let main_data = qs.stringify({
        'client_id': AUTH0_CLIENT,
        'scope': 'openid profile email offline_access',
        'audience': 'https://api.cauldronmc.com'
    });

    return new Promise(async (resolve, reject) => {
        if (await keytar.getPassword('cauldroncli',keytarAccount) != null) {
            let refresh = await keytar.getPassword('cauldroncli',keytarAccount);
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
            const response = await fetch("http://localhost:3000/admin/refresh_cli", config);

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
                    resolve({login_needed:true,data:await response.json()});
                } catch (e) {
                    reject(e);
                }
            } else {
                resolve({login_needed:false,data:await response.json()});
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
                resolve({login_needed:true,data:await response.json()});
            } catch (e) {
                reject(e);
            }
        }
    })
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
                    keytar.setPassword('cauldroncli',keytarAccount,responseData.refresh_token);
                    resolve(responseData);
                }
            } catch (e) {
                reject(e);
                //Suppress Error
            }

        }, 5000);
    })
}

async function grabUserInfo(accessToken) {
    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        };
        try {
            const response = await fetch("https://cauldronmc.uk.auth0.com/userinfo", config);
            resolve(response.json());
        } catch (e) {
            resolve(false);
        }
    })


}

function logout() {
    return new Promise(async (resolve, reject) => {
        if (await keytar.getPassword('cauldroncli',keytarAccount) != null) {
            // noinspection ES6MissingAwait
            keytar.deletePassword('cauldroncli',keytarAccount);
            console.log(`👋 Logged Out`)
        } else {
            console.log('⚠️ You Are not Logged In')
        }
    })


}



module.exports = {startAuthFlow, waitForComplete, grabUserInfo, logout};