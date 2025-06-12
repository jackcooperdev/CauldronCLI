// noinspection JSUnresolvedReference

const { Command } = require('commander');

const { logout, performLoginFlow } = require('../libs/authentication.js');


module.exports = {
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

};