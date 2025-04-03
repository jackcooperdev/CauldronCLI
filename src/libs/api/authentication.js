const qs = require('qs');
const axios = require("axios");


async function startAuthFlow() {
    let data = qs.stringify({
        'client_id': AUTH0_CLIENT,
        'scope': 'profile offline_access',
        'audience': 'https://api.cauldronmc.com'
    });

    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://cauldronmc.uk.auth0.com/oauth/device/code',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data : data
        };
        try {
            const response = await axios(config);
            resolve(response.data);
        } catch (e) {
            reject(e);
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
            url: 'https://cauldronmc.uk.auth0.com/oauth/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'},
            data : data
        };
            const tryAuth = setInterval(async function () {
                try {
                    const response = await axios(config1);
                    clearInterval(tryAuth);
                    resolve(response.data);
                } catch (e) {
                }

            }, 5000);
    })
}

module.exports = {startAuthFlow, waitForComplete};