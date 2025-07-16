// noinspection JSUnresolvedReference

const { Command } = require('commander');



const {
    getAuthedUsers,
    logoutUser,
    refreshAccounts,
    performMCLoginFlow,
    startMCAccount
} = require('../libs/minecraft-auth.js');

const { select } = require('@inquirer/prompts');

module.exports = {
    add_account: new Command('add')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-l, --device_code <type>', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .description('Add Minecraft Account')
        .action(async (options) => {

            if (!options.headless) {
                await performMCLoginFlow();
                process.exit(0)
            } else {
                if (!options.device_code) {
                    let loginCode = await startMCAccount();
                    console.log(loginCode.data);
                    process.exit(0);
                } else {
                    let response_message = await performMCLoginFlow(options.device_code);
                    console.log(response_message);
                    process.exit(0)
                }
            }

        }),

    remove_account: new Command('remove')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-a, --account <type>', 'Account ID', undefined)
        .option('-d, --debug', 'output extra debugging information')
        .description('Remove Minecraft Account')
        .action(async (options) => {
            if (!options.account) {
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
            } else {
                await logoutUser(options.account);
                console.log("💥  Removed Account")
                process.exit(0)
            }

        }),

    list_accounts: new Command('list_accounts')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .description('List Minecraft Accounts')
        .action(async () => {
            const users = await getAuthedUsers();
            console.log(users);
            process.exit(0)
        }),

    refresh: new Command('refresh')
        .option('-h, --headless', 'Skip Interactive Elements')
        .option('-d, --debug', 'output extra debugging information')
        .description('Refresh Minecraft Accounts')
        .action(async () => {
            await refreshAccounts(true);
            process.exit(0)
        }),
};