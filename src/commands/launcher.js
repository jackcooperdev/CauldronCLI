// noinspection JSUnresolvedReference
const { Command } = require('commander');

const { cauldronLogger, startMCListening } = require('@jackcooperdev/cauldronengine/logger');
const { launchMinecraft } = require("../libs/launcher.js");
const path = require("path");
const { getEnginePath } = require("../utils/enviromentManager.js");
const fs = require("fs");
const { createModpack, createCurseforgePack, createModrinthPack, installModpack } = require("../utils/modpack.js");
const { createOutput } = require("../utils/output");
const { jwtDecode } = require("jwt-decode");
const { rimraf } = require("rimraf");
const { verifyInstallation } = require('@jackcooperdev/cauldronengine/queue');
const { startServer } = require('@jackcooperdev/cauldronengine/launcher');

module.exports = {
    start: new Command('start')
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
        .option('-c --cache', 'Use Cache For Modpack')
        /* .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')
        .option('--curseforge <base64>', 'Base64 String of curseforge modpack (check docs)')
        .option('--modrinth <base64>', 'Base64 String of modrinth modpack (check docs)') */

        .action(async (options) => {
            try {
                let { mc_loader, mc_version, name, curseforge_mods, modrinth_mods, cache } = options
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
                if ((curseforge_mods || modrinth_mods) && !cache) {
                    console.log('normla')
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
                } else if (cache) {
                    // Cache Look for modpack inside named folder
                    let expDir = path.join(getEnginePath(),'modpacks',name);
                    if (fs.existsSync(expDir)) {
                        await installModpack(name);
                    };
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

};