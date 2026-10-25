const { Command } = require('commander');
const { isPackaged, getAssetName, checkForUpdate, installUpdate } = require('../libs/updater.js');
const { createOutput } = require("../utils/output");
const pkg = require('../../package.json');

module.exports = {
    update: new Command('update')
        .description('Update CauldronCLI to the latest version')
        .option('-c, --check', 'Only check for an update')
        .option('-g, --headless', 'Skip Interactive Elements')
        .action(async (options) => {
            const out = createOutput(options.headless);
            try {
                if (!isPackaged()) {
                    out.error('Updates are only available for release binaries. Update this copy with git / npm');
                    process.exit(1);
                }
                if (!getAssetName()) {
                    out.error(`No release binary is available for ${process.platform}-${process.arch}`);
                    process.exit(1);
                }

                const release = await checkForUpdate(true);
                if (!release) {
                    out.event(`CauldronCLI ${pkg.version} is up to date`);
                    out.success({ message: 'up_to_date', current: pkg.version, latest: pkg.version, updated: false });
                    process.exit(0);
                }
                if (options.check) {
                    out.event(`CauldronCLI ${release.version} is available (current: ${pkg.version}). Release notes: ${release.notes}`);
                    out.success({ message: 'update_available', current: pkg.version, latest: release.version, updated: false });
                    process.exit(0);
                }

                out.event(`Downloading CauldronCLI ${release.version}...`);
                await installUpdate(release);
                out.event(`Updated CauldronCLI ${pkg.version} -> ${release.version}. Release notes: ${release.notes}`);
                out.success({ message: 'updated', current: pkg.version, latest: release.version, updated: true });
            } catch (e) {
                out.error(`Update failed: ${e.message}`);
                process.exit(1);
            }
            process.exit(0);
        }),
};
