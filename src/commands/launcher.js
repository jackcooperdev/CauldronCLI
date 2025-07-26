// noinspection JSUnresolvedReference
const { Command } = require('commander');

const { cauldronLogger, startMCListening } = require('@jackcooperdev/cauldronengine/logger');

const { getAuthedUsers, refreshAccounts } = require("../libs/minecraft-auth.js");
const { launchMinecraft } = require("../libs/launcher.js");
const { downloadProfiles, getProfiles } = require("../libs/profileManager.js");
const path = require("path");
const { getEnginePath } = require("../utils/enviromentManager.js");
const fs = require("fs");
const { createModpack } = require("../utils/modpack.js");
const { select } = require('@inquirer/prompts');

module.exports = {
    quick_launch: new Command('quick-launch')
        .description('Quick Launch a Minecraft Instance')
        .requiredOption('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .option('-m, --account <type>', 'Minecraft Account Identifier')
        .option('-i, --dry', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-n, --headless', 'Skip Interactive Elements')
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
                        cauldronLogger.error('No Accounts Logged In! Run cauldroncli add')
                        process.exit(1);
                    }
                } else {
                    const currentAccounts = await getAuthedUsers();
                    for (let account of currentAccounts) {
                        if (account.value === options.account) {
                            mc_account = account;
                        }
                    }
                    if (!mc_account) {
                        cauldronLogger.error('No Accounts Logged In! Run cauldroncli add')
                        process.exit(1);
                    }
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

                const startLaunch = await launchMinecraft(`quick-${options.mc_loader}-${options.mc_version}`, mc_account.value, profileInfo, options.install_only);
                cauldronLogger.info(`Started Session: ${startLaunch}`)
                if (!options.install_only) {
                    await startMCListening();
                }
                process.exit(0)
            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
    launch: new Command('launch')
        .description('Launch a Minecraft Profile')
        .option('-p, --profile <type>', 'Profile ID', undefined)
        .option('-m, --account <type>', 'Minecraft Account Identifier')
        .option('-i, --dry', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-n, --headless', 'Skip Interactive Elements')
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
                        cauldronLogger.error('No Accounts Logged In! Run cauldroncli add')
                        process.exit(1);
                    }
                } else {
                    const currentAccounts = await getAuthedUsers();
                    for (let account of currentAccounts) {
                        if (account.value === options.account) {
                            mc_account = account;
                        }
                    }
                    if (!mc_account) {
                        cauldronLogger.error('No Accounts Logged In! Run cauldroncli add')
                        process.exit(1);
                    }
                }
                cauldronLogger.debug(`Selected Account: ${mc_account.name}`);

                //await refreshAccounts();
                cauldronLogger.debug('Refreshed Accounts')
                await downloadProfiles();
                cauldronLogger.debug('Passed Refresh and Download')
                let profiles = await getProfiles();
                let profileOptions = [];
                let answer;
                if (!options.profile) {
                    for (let idx in profiles) {
                        profileOptions.push({"name":`${profiles[idx].profileName} (${profiles[idx].options.version}-${profiles[idx].options.loader})`, "value":profiles[idx]})
                    }

                    profileOptions.push({"name": "Exit", value: false})
                     answer = await select({
                        message: 'Select a Profile to launch',
                        choices: profileOptions
                    });
                } else {
                    cauldronLogger.debug('Looking for Profile: '+options.profile);
                    cauldronLogger.debug('Profile Length: '+profiles.length);
                    for (let idx in profiles) {
                        if (profiles[idx]._id === options.profile) {
                            answer = profiles[idx]
                            //break;
                        }
                    }
                }

                if (answer) {
                    let profileInfo = answer;

                    // Check Profile History

                    if (!fs.existsSync(path.join(getEnginePath(), 'config', 'local_profiles.json'))) {
                        fs.writeFileSync(path.join(getEnginePath(), 'config', 'local_profiles.json'),'{}')
                    }

                    let localProfiles = JSON.parse(fs.readFileSync(path.join(getEnginePath(), 'config', 'local_profiles.json')).toString());
                    let modpackUpdate = false;

                    if (localProfiles[profileInfo._id]) {
                        if (localProfiles[profileInfo._id] !== profileInfo.updatedAt) {
                            modpackUpdate = true;
                            localProfiles[profileInfo._id] = profileInfo.updatedAt;
                        }
                    } else {
                        // Assume First Time Boot of Profile
                        localProfiles[profileInfo._id] = profileInfo.updatedAt;
                    }
                    fs.writeFileSync(path.join(getEnginePath(), 'config', 'local_profiles.json'),JSON.stringify(localProfiles, null, 2));
                    cauldronLogger.debug('Ready to Boot')
                    cauldronLogger.info(`Starting Minecraft Version: ${profileInfo.options.version} (${profileInfo.options.loader}) with account ${mc_account.name}`);
                    cauldronLogger.debug(profileInfo);
                    // Handle Modded Pack
                    if (profileInfo.isModded) {
                        if (!fs.existsSync(path.join(getEnginePath(),'modpacks',profileInfo._id)) || modpackUpdate) {
                            cauldronLogger.warn("Modpack not found downloading!")
                            await createModpack(profileInfo)
                        }
                    }

                    const startLaunch = await launchMinecraft(`${profileInfo._id}`, mc_account.value, profileInfo, options.install_only);
                    cauldronLogger.info(`Started Session: ${startLaunch}`)
                    if (!options.install_only) {
                        await startMCListening();
                    }
                    process.exit(0)
                } else {
                    cauldronLogger.debug('I seem to be stuck')
                }

            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
};