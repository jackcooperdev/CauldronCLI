const {resetCauldron, initializeCauldron} = require("../libs/system");
const {logout, performLoginFlow, waitForComplete} = require("../libs/authentication");

async function loginToAPI() {
    return await performLoginFlow(true);
}


async function checkLoginProgress(login_code) {
    try {
        let content = await waitForComplete(login_code);
        if (content.access_token) {
            return {'message': 'login successful'}
        }
        return await waitForComplete(login_code);
    } catch (e) {
        return {'message': 'login not perfornmed'}
    }

}

async function setup() {
    await initializeCauldron()
}


async function uninstall() {
    await resetCauldron()
    await logout();
}


module.exports = {loginToAPI,checkLoginProgress}