const { Command } = require('commander');
const { createModpack, installModpack } = require('../utils/modpack');
const { createOutput } = require("../utils/output");
const path = require('path')
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
        .option('--premade <base64>', 'Base64 String of curseforge modpack (check docs)')

        .action(async (options) => {
            let start = Date.now();
            let headless = options.headless;
            const out = createOutput(headless);
            let { name, premade } = options


            let decodedPack = atob(premade).split(";");
            let payload = {
                url: decodedPack[0],
                sha1: decodedPack[1].toLowerCase(),
                name
            }
            let packName = await createModpack('premade', payload);

            await installModpack(packName.name)

            out.success(packName)
            let end = Date.now()
            let final = end - start
            console.log('took ' + final + 'ms')


            process.exit(0);
        })


}