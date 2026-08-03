// noinspection JSUnresolvedReference
const { Command } = require('commander');

const { cauldronLogger, startMCListening } = require('@jackcooperdev/cauldronengine/logger');
const { launchMinecraft } = require("../libs/launcher.js");
const path = require("path");
const { getEnginePath } = require("../utils/enviromentManager.js");
const fs = require("fs");
const { createModpack, createCurseforgePack, createModrinthPack } = require("../utils/modpack.js");
const { createOutput } = require("../utils/output");
const { jwtDecode } = require("jwt-decode");
const { rimraf } = require("rimraf");
const { verifyInstallation } = require('@jackcooperdev/cauldronengine/queue');
const { startServer } = require('@jackcooperdev/cauldronengine/launcher');

module.exports = {
    start: new Command('start')
        .description('Launch a Minecraft Instance')
        .requiredOption('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .option('-n --name <name>', 'Instance Name')
        .option('-m, --account <token>', 'Minecraft Access Token')
        .option('-i, --dry', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .option('-c --cache', 'Use Cache For Modpack')
        .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')
        .option('--curseforge <base64>', 'Base64 String of curseforge modpack (check docs)')
        .option('--modrinth <base64>', 'Base64 String of modrinth modpack (check docs)')

        .action(async (options) => {
            try {
                let headless = options.headless;
                const out = createOutput(headless);
                if (options.debug) {
                    cauldronLogger.level = 4;
                }
                let mc_account;
                if (!options.account) {
                    if (!headless) {
                        cauldronLogger.error('No Account Provided (a)')
                    } else {
                        out.error('no_account')
                    }
                    process.exit(1);
                }

                if (!mc_account) {
                    mc_account = options.account
                }
                let accountData;
                try {
                    accountData = jwtDecode(mc_account);
                } catch (e) {
                    console.error(e);
                    if (!headless) {
                        cauldronLogger.error('No Account Provided')
                    } else {
                        out.error('no_account')
                    }
                    process.exit(1);
                }
                cauldronLogger.debug(`Account Verified as: ${accountData.pfd[0].name}`);
                cauldronLogger.info(`Starting Minecraft Version: ${options.mc_version} (${options.mc_loader}) with account ${accountData.pfd[0].name}`);
                //await refreshAccounts();
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
                let sessionName = `quick-${options.mc_loader}-${options.mc_version}`
                if (options.name) {
                    sessionName = options.name
                }

                // Create and Install Modpack

                profileInfo['isModded'] = !!(options.curseforge_mods || options.modrinth_mods || options.cache || options.curseforge || options.modrinth);
                profileInfo['isUsingPreBuildModpack'] = !!(options.curseforge || options.modrinth);

                if (profileInfo['isModded']) {
                    profileInfo['useModCache'] = false;
                    if (options.cache) {
                        profileInfo['useModCache'] = true;
                    } else if (!profileInfo['isUsingPreBuildModpack']) {
                        if (fs.existsSync(path.join(getEnginePath(), 'modpacks', sessionName + '_pack'))) {
                            await rimraf(path.join(getEnginePath(), 'modpacks', sessionName + '_pack'))
                        }

                        if (options.curseforge_mods) {
                            let modArray = options.curseforge_mods.split(" ")
                            let newMods = [];
                            for (let mod of modArray) {
                                let obj = {
                                    source: 'cf',
                                    slug: mod
                                }
                                newMods.push(obj);
                            }

                            let newPackData = {
                                name: `${sessionName}_pack`,
                                owner: accountData.pfd[0].name,
                                options: profileInfo.options,
                                modpackInfo: {
                                    provider: 'custom',
                                    mods: newMods
                                }

                            }
                            await createModpack(newPackData);

                            profileInfo['modpackInfo'] = {
                                provider: 'custom',
                                mods: newMods
                            };
                            profileInfo['isModded'] = true
                        }
                        if (options.modrinth_mods) {
                            let modArray = options.modrinth_mods.split(" ")
                            let newMods = [];
                            for (let mod of modArray) {
                                let obj = {
                                    source: 'mr',
                                    slug: mod
                                }
                                newMods.push(obj);
                            }

                            let newPackData = {
                                name: `${sessionName}_pack`,
                                owner: accountData.pfd[0].name,
                                options: profileInfo.options,
                                modpackInfo: {
                                    provider: 'custom',
                                    mods: newMods
                                }

                            }
                            await createModpack(newPackData);

                            profileInfo['modpackInfo'] = {
                                provider: 'custom',
                                mods: newMods
                            };
                            profileInfo['isModded'] = true
                        }
                    } else if (profileInfo['isUsingPreBuildModpack']) {
                        if (options.curseforge) {
                            let decodedModpack = atob(options.curseforge).split(";");

                            await createCurseforgePack(decodedModpack[0], `${sessionName}_pack`, decodedModpack[1]);
                        }

                        if (options.modrinth) {
                            let decodedModpack = atob(options.modrinth).split(";");

                            await createModrinthPack(decodedModpack[0], `${sessionName}_pack`, decodedModpack[1]);
                        }
                    }
                }



                const startLaunch = await launchMinecraft(sessionName, mc_account, profileInfo, options.dry);
                cauldronLogger.info(`Started Session: ${startLaunch}`)
                process.stdin.unref();
                if (!options.dry && !options.headless) {
                    await startMCListening();
                }


                //process.exit(0)
            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
    start_server: new Command('start_server')
        .description('Launch a Minecraft Instance')
        .requiredOption('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .option('-n --name <name>', 'Instance Name')
        .option('-m, --account <token>', 'Minecraft Access Token')
        .option('-i, --dry', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .option('-c --cache', 'Use Cache For Modpack')
        .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')
        .option('--curseforge <base64>', 'Base64 String of curseforge modpack (check docs)')
        .option('--modrinth <base64>', 'Base64 String of modrinth modpack (check docs)')

        .action(async (options) => {
            try {
                await startServer('abc1234','release','forge')
                //proces s.exit(0)
            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
};