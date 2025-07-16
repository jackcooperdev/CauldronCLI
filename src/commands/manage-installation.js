// noinspection JSUnresolvedReference

const { Command } = require('commander');
const { resetCauldron, initializeCauldron } = require('../libs/system.js');
const { performLoginFlow } = require("../libs/authentication.js");
const { downloadProfiles } = require("../libs/profileManager.js");
const { confirm } = require('@inquirer/prompts');
const { performMCLoginFlow } = require("../libs/minecraft-auth.js");
const {logout, waitForComplete} = require("../libs/authentication");
const {cauldronLogger} = require("@jackcooperdev/cauldronengine/logger");
const {getEnginePath} = require("../utils/enviromentManager");
const {getOperatingSystem} = require("@jackcooperdev/cauldronengine/compat");

module.exports = {
    reset: new Command('reset')
        .description('Reset Cauldron Installation')
        .action(async () => {
            await resetCauldron()
            await initializeCauldron()
            process.exit(0);
        }),


    uninstall: new Command('uninstall')
        .description('Uninstall Cauldron Installation')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async () => {
            await resetCauldron()
            await logout();
            process.exit(0);

        }),


    test: new Command('test')
        .description('Uninstall Cauldron Installation')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async () => {
            process.exit(0);

        }),

};