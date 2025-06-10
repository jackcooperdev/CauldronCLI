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
    refreshAccounts, performMCLoginFlow,
} from '../libs/minecraft-auth.js';

import {startMCAccount} from '../libs/minecraft-auth.js';
import {select, Separator} from '@inquirer/prompts';
import {exec} from 'child_process';

export default {
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