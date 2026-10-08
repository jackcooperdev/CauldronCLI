const { Command } = require('commander');
const { createModpack, installModpack } = require('../utils/modpack');
const { createOutput } = require("../utils/output");
const path = require('path');
const { cauldronLogger } = require('@jackcooperdev/cauldronengine/logger');
const { getPackInfo, getPackIndex, removeMods, addMods } = require('@jackcooperdev/cmm/pack');
const { getEnginePath } = require('../utils/enviromentManager');
module.exports = {

    create: new Command('createMPack')
        .description('Create A New Modpack')
        .requiredOption('-v, --mc_version <type>', 'Minecraft Version')
        .option('-l, --mc_loader <type>', 'Minecraft Loader', 'vanilla')
        .option('-x, --mc_loader_version <type>', 'Minecraft Loader Version', undefined)
        .requiredOption('-n --name <name>', 'Instance Name')
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')

        .action(async (options) => {
            let headless = options.headless;
            const out = createOutput(headless);
            let { mc_loader, mc_version, name, curseforge_mods, modrinth_mods } = options
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
                out.success(packPayload)
            } catch (e) {
                out.error(e)
            }


            process.exit(0);
        }),

    import: new Command('importMPack')
        .description('Import A Modpack')
        .option('-n --name <name>', 'Instance Name')
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .requiredOption('--premade <base64>', 'Base64 String of curseforge modpack (check docs)')

        .action(async (options) => {
            let headless = options.headless;
            const out = createOutput(headless);
            let { name, premade } = options


            let decodedPack = atob(premade).split(";");
            let payload = {
                url: decodedPack[0],
                sha1: decodedPack[1].toLowerCase(),
                name
            }
            try {
                let packName = await createModpack('premade', payload);
                await installModpack(packName.name)

                out.success(packName)

            } catch (e) {
                if (headless) {
                    out.error(e)
                } else {
                    cauldronLogger.error(e)
                }
            }


            process.exit(0);
        }),

    list: new Command('getMPack')
        .description('Get Modpack Information')
        .requiredOption('-n --name <name>', 'Instance Name')
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')

        .action(async (options) => {
            let { name, headless } = options;
            let packPath = path.join(getEnginePath(), 'modpacks', name)
            const out = createOutput(headless);

            let packData = await getPackInfo(packPath);
            if (!packData) {
                cauldronLogger.error('No Modpack with name: ' + name)
                if (headless) {
                    out.error('No Modpack with name: ' + name)
                }
            } else {
                let indexInfo = await getPackIndex(packPath);
                let modFilter = indexInfo.filter(obj => obj.metafile)
                out.data({ mods: modFilter })
                out.success({ got: true })
            }
            process.exit(0);
        }),
    modify: new Command('modifyMPack')
        .description('Modify Existing Modpack')
        .requiredOption('-n --name <name>', 'Instance Name')
        .option('-d, --debug', 'output extra debugging information')
        .option('-g, --headless', 'Skip Interactive Elements')
        .option('--remove <mods>', 'CSV of curseforge slugs')
        .option('--curseforge_mods <mods>', 'CSV of curseforge slugs')
        .option('--modrinth_mods <mods>', 'CSV of modrinth slugs')

        .action(async (options) => {
            let { name, headless, remove = "", curseforge_mods, modrinth_mods } = options;
            let packPath = path.join(getEnginePath(), 'modpacks', name)
            const out = createOutput(headless);

            let packData = await getPackInfo(packPath);
            if (!packData) {
                cauldronLogger.error('No Modpack with name: ' + name)
                if (headless) {
                    out.error('No Modpack with name: ' + name)
                }
            } else {
                let rMods = remove.split(",")

                await removeMods(packPath, rMods);

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

                await addMods(packPath,mods);


            }
            process.exit(0);
        })


}