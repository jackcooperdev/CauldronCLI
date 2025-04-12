// noinspection JSUnresolvedReference

const {Command} = require('commander');
const ora = require("ora-classic");
const {resetCauldron} = require("../libs/system");

module.exports = {
    reset: new Command('reset')
        .description('Reset Cauldron Installation')
        .action(async () => {
            await resetCauldron()
        }),
};