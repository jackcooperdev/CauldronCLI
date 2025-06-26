const {resetCauldron, initializeCauldron} = require("../libs/system");
const {logout, performLoginFlow} = require("../libs/authentication");

async function loginToAPI() {
    await performLoginFlow(true)
}


async function setup() {
    await initializeCauldron()
}


async function uninstall() {
    await resetCauldron()
    await logout();
}


module.exports = {loginToAPI}