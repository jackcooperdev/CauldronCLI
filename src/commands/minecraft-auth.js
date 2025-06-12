// noinspection JSUnresolvedReference

const { Command } = require('commander');



const {
    getAuthedUsers,
    logoutUser,
    refreshAccounts,
    performMCLoginFlow,
} = require('../libs/minecraft-auth.js');

const { select } = require('@inquirer/prompts');

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