// noinspection JSUnresolvedReference

const {Command} = require('commander');
const {startAuthFlow, waitForComplete, grabUserInfo, logout} = require("../libs/authentication");
const ora = require("ora-classic");

module.exports = {
    addTo: new Command('add')
        .description('Add a new item')
        .argument('<item>', 'The item to add')
        .action((item) => {
            console.log(`Adding item: ${item}`);
            // Your add logic here
        }),

    login_to_api: new Command('login')
        .description('Login To CauldronAPI')
        .action(async () => {
            let access_token;
            const AUTH_DATA = await startAuthFlow();
            if (AUTH_DATA.login_needed) {
                let start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
                require('child_process').exec(start + ' ' + AUTH_DATA.data.verification_uri_complete);
                console.log(`🚨 Your Code is ${AUTH_DATA.data.user_code}. Please Ensure it matches the one displayed in browser`);
                console.log(`Opening Web Browser to Continue Login. If this does not work open this URL: ${AUTH_DATA.data.verification_uri_complete}`)
                const spinner = ora(`Waiting For Login...`).start();
                const code = await waitForComplete(AUTH_DATA.data.device_code);
                access_token = code.access_token;
                spinner.succeed(" Done!")
            } else {
                access_token = AUTH_DATA.data.access_token;
            }
            try {
                const uData = await grabUserInfo(access_token);
                console.log(`👋 Hello ${uData.name} (${uData.email}) You Are Logged Into CauldronAPI`);
            } catch (e) {
                console.log('⚠️ An Unexpected error occurred. Please try again later.');
            }
        }),

    logout: new Command('logout')
        .description('Login To CauldronAPI')
        .action(async () => {
            await logout()
        }),
};