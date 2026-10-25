#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

const command2 = require('../src/commands/manage-installation.js');
const command3 = require('../src/commands/launcher.js');
const command4 = require('../src/commands/modpack.js');
const command5 = require('../src/commands/update.js');
const pkg = require('../package.json');
const { initializeCauldron } = require("../src/libs/system");
const { autoUpdate, cleanupUpdate } = require("../src/libs/updater");

async function loadCommands() {
    // Add commands from each imported module

    for (const commandName in command2) {
        if (command2[commandName] instanceof Command) {
            program.addCommand(command2[commandName]);
        }
    }
    for (const commandName in command3) {
        if (command3[commandName] instanceof Command) {
            program.addCommand(command3[commandName]);
        }
    }
    for (const commandName in command4) {
        if (command4[commandName] instanceof Command) {
            program.addCommand(command4[commandName]);
        }
    }
    for (const commandName in command5) {
        if (command5[commandName] instanceof Command) {
            program.addCommand(command5[commandName]);
        }
    }
}

async function main() {
    program
        .name('cauldroncli')
        .description('CLI For Managing Minecraft')
        .version(pkg.version)
    //.option('-d, --debug', 'output extra debugging information')

    await initializeCauldron()
    cleanupUpdate()
    await loadCommands(); // Load other commands

    // Check for updates before interactive commands. Headless mode is skipped so apps
    // controlling the CLI (e.g. the dashboard) stay on the version they ship
    program.hook('preAction', async (thisCommand, actionCommand) => {
        const skip = ['update', 'uninstall', 'reset'];
        if (!actionCommand.opts().headless && !skip.includes(actionCommand.name())) {
            await autoUpdate();
        }
    });

    await program.parseAsync(process.argv);

}
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    //graceful shutdown
    process.exit();
});
main();