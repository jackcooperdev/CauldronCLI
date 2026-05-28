// noinspection JSUnresolvedReference

const { Command } = require('commander');
const { resetCauldron, initializeCauldron } = require('../libs/system.js');
module.exports = {
    reset: new Command('reset')
        .description('Reset Cauldron Installation')
        .action(async () => {
            await resetCauldron()
            await initializeCauldron()
            process.exit(0);
        }),


    uninstall: new Command('uninstall')
        .description('Uninstall Cauldron Installation')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async () => {
            await resetCauldron()
            process.exit(0);

        }),


    test: new Command('test')
        .description('Test Command To test features')
        .option('-n, --headless', 'Skip Interactive Elements')
        .action(async () => {
            console.log('how much dedatted wam do i need for my server?')
            process.exit(0);
        }),

};