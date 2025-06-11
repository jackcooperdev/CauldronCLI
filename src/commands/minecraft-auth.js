// noinspection JSUnresolvedReference

const { Command } = require('commander');

const ora = require('ora-classic');
const { resetCauldron } = require('../libs/system.js');
const { sendToServer } = require('../utils/apiCommunication.js');
const { grabServerAddress } = require('../utils/enviromentManager.js');

const {
    waitForComplete,
    writeToAccountsFile,
    encrypt,
    processRefreshToken,
    grabAccountInfo,
    getAuthedUsers,
    logoutUser,
    refreshAccounts,
    performMCLoginFlow,
} = require('../libs/minecraft-auth.js');

const { startMCAccount } = require('../libs/minecraft-auth.js');
const { select, Separator } = require('@inquirer/prompts');
const { exec } = require('child_process');

module.exports = {
    add_account: new Command('add')
        .description('Add Minecraft Account')
        .action(async () => {
            await performMCLoginFlow();
        }),

    remove_account: new Command('remove')
        .description('Remove Minecraft Account')
        .action(async () => {
            const users = await getAuthedUsers();
            users.push({"name": "Exit", value: false})
            const answer = await select({
                message: 'Select a User to Remove',
                choices: users
            });

            if (answer) {
                await logoutUser(answer);
                console.log("💥  Removed Account")
            }
        }),

    refresh: new Command('refresh')
        .description('Refresh Minecraft Accounts')
        .action(async () => {
            await refreshAccounts(true);
        }),
};