const {resetCauldron, initializeCauldron} = require("../libs/system");
const {performLoginFlow, logout} = require("../libs/authentication");
const {downloadProfiles} = require("../libs/profileManager");
const {performMCLoginFlow} = require("../libs/minecraft-auth");


async function reset() {
    await resetCauldron();
    await initializeCauldron();
}


async function setup() {
    await initializeCauldron()
}


async function uninstall() {
    await resetCauldron()
    await logout();
}


module.exports = {reset, setup, uninstall}