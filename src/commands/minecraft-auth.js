// noinspection JSUnresolvedReference

import {Command} from 'commander';

import ora from 'ora';
import {resetCauldron} from '../libs/system.js';
import {sendToServer} from '../utils/apiCommunication.js';
import {grabServerAddress} from '../utils/enviromentManager.js';

import {
    waitForComplete,
    writeToAccountsFile,
    encrypt,
    processRefreshToken,
    grabAccountInfo,
    getAuthedUsers,
    logoutUser,
    refreshAccounts,
} from '../libs/minecraft-auth.js';

import {startMCAccount} from '../libs/minecraft-auth.js';
import {select, Separator} from '@inquirer/prompts';
import {exec} from 'child_process';

export default {
    add_account: new Command('add')
        .description('Add Minecraft Account')
        .action(async () => {
            let spinner = ora(`Waiting For Login...`)
            try {
                const AUTH_DATA = await startMCAccount();
                let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                exec(start + ' ' + AUTH_DATA.data.url);
                console.log(`✨  Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.url}`)
                spinner.start();
                const sign_in = await waitForComplete(AUTH_DATA.data.code);
                spinner.succeed(` Acquired Microsoft Refresh Token`);
                spinner.start(`Writing To File...`)
                await writeToAccountsFile(AUTH_DATA.data.code, {"refresh_token": encrypt(sign_in.token)});
                spinner.succeed(` Written to File`);
                spinner.start(`Logging into Minecraft...`)
                await processRefreshToken(AUTH_DATA.data.code);
                spinner.succeed(` Logged Into Minecraft`);
                spinner.start(`Getting Account Info From Minecraft...`);
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