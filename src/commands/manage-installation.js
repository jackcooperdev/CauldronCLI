// noinspection JSUnresolvedReference

const { Command } = require('commander');
const { resetCauldron, initializeCauldron } = require('../libs/system.js');
const { performLoginFlow } = require("../libs/authentication.js");
const { downloadProfiles } = require("../libs/profileManager.js");
const { confirm } = require('@inquirer/prompts');
const { performMCLoginFlow } = require("../libs/minecraft-auth.js");

module.exports = {
    reset: new Command('reset')
        .description('Reset Cauldron Installation')
        .action(async () => {
            await resetCauldron()
            await initializeCauldron()
        }),

    setup: new Command('setup')
        .description('Setup Cauldron Installation')
        .action(async () => {
            await initializeCauldron()
            await performLoginFlow();
            await downloadProfiles();
            const answer = await confirm({
                message: 'Would you like to add a Minecraft account?',
            });
            if (answer) {
                await performMCLoginFlow();
            }
        }),

    uninstall: new Command('uninstall')
        .description('Uninstall Cauldron Installation')
        .action(async () => {
            await resetCauldron()
        }),
};