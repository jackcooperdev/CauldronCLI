// noinspection JSUnresolvedReference
const { Command } = require('commander');

const { cauldronLogger, startMCListening } = require('@jackcooperdev/cauldronengine/logger');
const { launchMinecraft, createMinecraftInstance } = require("../libs/launcher.js");
const path = require("path");
const { getEnginePath } = require("../utils/enviromentManager.js");
const fs = require("fs");
const axios = require('axios')
const { createModpack, createCurseforgePack, createModrinthPack, installModpack } = require("../utils/modpack.js");
const { createOutput } = require("../utils/output");
const { jwtDecode } = require("jwt-decode");
const { rimraf } = require("rimraf");
const { verifyInstallation } = require('@jackcooperdev/cauldronengine/queue');
//const { startServer } = require('@jackcooperdev/cauldronengine/launcher');
let GENERIC_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"
module.exports = {
    start_new: new Command('start')
        .description('Launch a Minecraft Instance')
        .option('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .option('-n --name <name>', 'Instance Name')
        .option('-m, --account <token>', 'Minecraft Access Token')
        .option('-i, --dry', "Install but dont launch", false)
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')
        .option('-c --cache', 'Use Cache For Modpack')
        .option('-o --overrides <overrides>', 'Overrides When Launching (CSV) e.g ram=2,ram_low=1')

        .action(async (options) => {
            try {
                let { mc_loader, mc_version, mc_loader_version, name, curseforge_mods, modrinth_mods, cache, overrides, account } = options
                let headless = options.headless;
                let offlineMode = false;
                const out = createOutput(headless);
                if (options.debug) {
                    cauldronLogger.level = 4;
                }
                let mc_account = { demo: true, token: "", accountData: {} };
                if (!account) {
                    account = GENERIC_JWT;
                    offlineMode = true;
                } else {
                    mc_account.token = account;
                }
                let accountData;

                if (!offlineMode) {
                    try {
                        accountData = jwtDecode(mc_account.token);
                        mc_account.accountData = jwtDecode(mc_account.token);
                    } catch (e) {
                        console.error(e);
                        if (!headless) {
                            cauldronLogger.error('Invalid Token')
                        } else {
                            out.error('no_account')
                        }
                        process.exit(1);
                    }
                }


                let acceptedOverrides = {
                    'ram': 'jvm',
                    'ram_low': 'jvm',
                    'server_ip': 'game',
                    'username': 'game'
                }
                if (overrides) {
                    overrides = overrides.split(",");
                    let finalOverrides = { jvm: {}, game: {} };
                    for (let override of overrides) {
                        let split = override.split("=");
                        if (acceptedOverrides[split[0]]) {
                            finalOverrides[acceptedOverrides[split[0]]][split[0]] = split[1]
                        }
                    }
                    overrides = finalOverrides;
                } else {
                    overrides = { jvm: {}, game: {} }
                }


                let username = 'Demo';
                if (!offlineMode) {
                    try {
                        cauldronLogger.debug(`Account Verified as: ${mc_account.accountData.pfd[0].name}`);
                        mc_account.demo = false;
                    } catch (e) {
                        if (!headless) {
                            cauldronLogger.error('Invalid Token')
                        } else {
                            out.error('no_account')
                        }
                        process.exit(1);
                    }
                    username = accountData.pfd[0].name
                } else {
                    cauldronLogger.error('No Valid MC Auth Token Provided Locking to Demo Mode');
                }
                cauldronLogger.info(`Starting Minecraft Version: ${options.mc_version} (${options.mc_loader}) with account ${username}`);



                let profileInfo = {
                    options: {
                        version: options.mc_version,
                        loaderInfo: {
                            type: mc_loader,
                            version: mc_loader_version
                        }
                    },
                    overrides: overrides
                }
                cauldronLogger.debug(profileInfo);
                let sessionName = `quick-${options.mc_loader}-${options.mc_version}`
                if (options.name) {
                    sessionName = options.name
                }

                // Create and Install Modpack
                if ((curseforge_mods || modrinth_mods) && !cache) {
                    let mods = [];

                    if (curseforge_mods) {
                        let temp = curseforge_mods.split(",");
                        for (let mod of temp) {
                            mods.push({
                                'slug': mod,
                                source: 'cf'
                            })
                        }
                    }
                    if (modrinth_mods) {
                        let temp = modrinth_mods.split(",");
                        for (let mod of temp) {
                            mods.push({
                                'slug': mod,
                                source: 'mr'
                            })
                        }
                    }
                    let packPayload = {
                        name,
                        loader: mc_loader,
                        minecraftVersion: mc_version,
                        author: 'cmm',
                        mods: mods
                    }

                    try {
                        await createModpack('custom', packPayload);
                        await installModpack(packPayload.name)
                    } catch (e) {
                        out.error(e)
                    }
                } else if (cache || name) {
                    // Cache Look for modpack inside named folder
                    let expDir = path.join(getEnginePath(), 'modpacks', name);
                    if (fs.existsSync(expDir)) {

                        let info = await installModpack(name);
                        profileInfo.options.version = info.versions.minecraft;
                        profileInfo.options.loaderInfo.type = info.versions.loader.type;
                        profileInfo.options.loaderInfo.version = info.versions.loader.version
                    };
                };

                if (!profileInfo.options.version) {
                    cauldronLogger.error("Please Define A version!")
                    if (headless) {
                        out.error('please define a version');

                    }
                    process.exit(1)
                }
                const startLaunch = await createMinecraftInstance(sessionName, mc_account, profileInfo, options.dry);
                process.stdin.unref();
                if (!options.dry && !options.headless && startLaunch !== 'DETACH') {
                    cauldronLogger.info(`Started Session: ${startLaunch}`)
                    await startMCListening();
                }
                process.exit(0)
            } catch (error) {
                cauldronLogger.error(error);
                process.exit(1);
            }


        }),
};