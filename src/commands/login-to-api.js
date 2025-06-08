// noinspection JSUnresolvedReference

import {Command} from 'commander';

import {startAuthFlow, waitForComplete, grabUserInfo, logout, performLoginFlow} from '../libs/authentication.js';
import ora from 'ora';
import {cauldronLogger} from "@jackcooperdev/cauldronengine/logger";
import {exec} from 'child_process';
import {initializeCauldron} from "../libs/system.js";

export default {
    login_to_api: new Command('login')
        .description('Login To CauldronAPI')
        .action(async () => {
            await performLoginFlow();
        }),

    logout: new Command('logout')
        .description('Logout from CauldronAPI')
        .action(async () => {
            await logout()
        }),

    test: new Command('test')
        .description('Logout from CauldronAPI')
        .option('-d, --debug', 'output extra debugging information')
        .action(async (options) => {
            console.log('Empty Test')
        }),
};