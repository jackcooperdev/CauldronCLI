// noinspection JSUnresolvedReference

const { Command } = require('commander');
const {startAuthFlow, waitForComplete} = require("../libs/api/authentication");
//const ora = require("ora");

module.exports = {
    addTo: new Command('add')
        .description('Add a new item')
        .argument('<item>', 'The item to add')
        .action((item) => {
            console.log(`Adding item: ${item}`);
            // Your add logic here
        }),

    login_to_api: new Command('login')
        .description('Add a new item')
        .action(async () => {
            const AUTH_DATA = await startAuthFlow();
            import("open").then(async ({ default: open }) => {
                console.log(AUTH_DATA)
                await open(AUTH_DATA.verification_uri_complete);
                import("ora").then(async ({ default: ora }) => {
                    console.log(`🚨 Your Code is ${AUTH_DATA.user_code}. Please Ensure it matches the one displayed in browser`)
                    const spinner = ora(`Opening Web Browser to Continue Login. If this does not work open this URL ${AUTH_DATA.verification_uri_complete}`).start();
                    const code = await waitForComplete(AUTH_DATA.device_code);
                    console.log(code);
                    spinner.succeed("Done!")
                });
            })


        }),
};