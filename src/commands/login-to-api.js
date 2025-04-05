// noinspection JSUnresolvedReference

const {Command} = require('commander');
const {startAuthFlow, waitForComplete, grabUserInfo, logout} = require("../libs/authentication");
const ora = require("ora-classic");

module.exports = {
    login_to_api: new Command('login')
        .description('Login To CauldronAPI')
        .action(async () => {
            try {
                const AUTH_DATA = await startAuthFlow();
                if (AUTH_DATA.login_needed) {
                    let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                    require('child_process').exec(start + ' ' + AUTH_DATA.data.verification_uri_complete);
                    console.log(`🚨 Your Code is ${AUTH_DATA.data.user_code}. Please Ensure it matches the one displayed in browser`);
                    console.log(`Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.verification_uri_complete}`)
                    const spinner = ora(`Waiting For Login...`).start();
                    await waitForComplete(AUTH_DATA.data.device_code);
                    spinner.succeed(" Done!")
                }

                const uData = await grabUserInfo();
                console.log(`👋 Hello ${uData.name} (${uData.email}) You Are Logged Into CauldronAPI`);
            } catch (e) {
                console.log('⚠️ An Unexpected error occurred. Please try again later.');
            }
        }),

    logout: new Command('logout')
        .description('Logout from CauldronAPI')
        .action(async () => {
            await logout()
        }),
};