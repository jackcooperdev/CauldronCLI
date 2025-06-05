// noinspection JSUnresolvedReference

import {Command} from 'commander';

import {startAuthFlow, waitForComplete, grabUserInfo, logout} from '../libs/authentication.js';
import ora from 'ora';
import {cauldronLogger, startMCListening} from "@jackcooperdev/cauldronengine/logger";
import {getAuthedUsers, refreshAccounts} from "../libs/minecraft-auth.js";
import {launchMinecraft} from "../libs/launcher.js";

export default {
    quick_launch: new Command('quick-launch')
        .description('Quick Launch a Minecraft Instance')
        .requiredOption('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .option('-m, --account <type>', 'Minecraft Account Identifier')
        .option('-i, --install_only', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .action(async (options) => {
            try {
                if (options.debug) {
                    cauldronLogger.level = 4;
                }
                let mc_account;
                if (!options.account) {
                    const currentAccounts = await getAuthedUsers();
                    if (currentAccounts.length !== 0) {
                        mc_account = currentAccounts[0];
                    } else {
                        cauldronLogger.error('No Accounts Logged In! Run cauldron add')
                        process.exit(1);
                    }
                } else {
                    mc_account = options.account;
                }
                cauldronLogger.debug(`Selected Account: ${mc_account.name}`);
                cauldronLogger.info(`Starting Minecraft Version: ${options.mc_version} (${options.mc_loader}) with account ${mc_account.name}`);
                await refreshAccounts();
                let overrides = {}
                let profileInfo = {
                    options: {
                        version: options.mc_version,
                        loader: options.mc_loader,
                        lVersion: options.mc_loader_version,
                    },
                    overrides: overrides
                }
                cauldronLogger.debug(profileInfo);
                if (!options.install_only) {
                    startMCListening();
                }
                const startLaunch = await launchMinecraft(`quick-${options.mc_loader}-${options.mc_version}`, mc_account.value, profileInfo, options.install_only);
                cauldronLogger.info(`Started Session: ${startLaunch}`)
            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
};