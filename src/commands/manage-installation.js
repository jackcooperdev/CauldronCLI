// noinspection JSUnresolvedReference

import { Command } from 'commander';
import ora from 'ora';
import { resetCauldron, initializeCauldron } from '../libs/system.js';
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
        }),
};