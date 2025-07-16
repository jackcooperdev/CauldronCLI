// noinspection JSUnresolvedReference

const { Command } = require('commander');

const { logout, performLoginFlow } = require('../libs/authentication.js');


module.exports = {
    login_to_api: new Command('login')
        .description('Login To CauldronAPI')
        .option('-n, --headless', 'Skip Interactive Elements')
        .option('-l, --device_code <type>', 'Skip Interactive Elements')
        .action(async (options) => {
            await performLoginFlow(options.headless,options.device_code);
            process.exit(0);
        }),

    logout: new Command('logout')
        .option('-n, --headless', 'Skip Interactive Elements')
        .description('Logout from CauldronAPI')
        .action(async () => {
            await logout()
            process.exit(0)
        }),

};