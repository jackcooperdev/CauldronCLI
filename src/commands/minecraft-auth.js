// noinspection JSUnresolvedReference

const {Command} = require('commander');
const ora = require("ora-classic");
const {resetCauldron} = require("../libs/system");
const {sendToServer} = require("../utils/apiCommunication");
const {grabServerAddress} = require("../utils/enviromentManager");
const {
    waitForComplete,
    writeToAccountsFile,
    encrypt,
    processRefreshToken,
    grabAccountInfo, getAuthedUsers, logoutUser
} = require("../libs/minecraft-auth");
const {startMCAccount} = require("../libs/minecraft-auth");
const { select, Separator} = require("@inquirer/prompts");

module.exports = {
    add_account: new Command('add')
        .description('Add Minecraft Account')
        .action(async () => {
            const spinner = ora(`Waiting For Login...`)
            try {
                const AUTH_DATA = await startMCAccount();

                let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                require('child_process').exec(start + ' ' + AUTH_DATA.data.url);
                console.log(`✨  Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.url}`)
                spinner.start();
                const sign_in = await waitForComplete(AUTH_DATA.data.code);
                await writeToAccountsFile(AUTH_DATA.data.code, {"refresh_token": encrypt(sign_in.token)});
                await processRefreshToken(AUTH_DATA.data.code);
                const account_info = await grabAccountInfo(AUTH_DATA.data.code);
                spinner.succeed(`👋 Hello ${account_info.profile.username} Your account has been added!.`);
            } catch (e) {
                console.log(e)
                spinner.fail('⚠️ An Unexpected error occurred. Please try again later.')
            }
        }),

    remove_account: new Command('remove')
        .description('Remove Minecraft Account')
        .action(async () => {
            const users = await getAuthedUsers();
            users.push({"name":"Exit",value:false})
            console.log(users)
            const answer = await select({
                message: 'Select a User to Remove',
                choices: users
            });

            if (answer) {
                await logoutUser(answer);
                console.log("💥  Removed Account")
            }
        }),
};