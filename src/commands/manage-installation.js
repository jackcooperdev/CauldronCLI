// noinspection JSUnresolvedReference

import {Command} from 'commander';
import {resetCauldron, initializeCauldron} from '../libs/system.js';
import loginToApi from "./login-to-api.js";
import {performLoginFlow} from "../libs/authentication.js";
import {downloadProfiles} from "../libs/profileManager.js";
import {confirm} from "@inquirer/prompts";
import {performMCLoginFlow} from "../libs/minecraft-auth.js";

let enabledDebugNamespaces = [];
export default {
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