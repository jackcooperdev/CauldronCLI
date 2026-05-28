#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

const command2 = require('../src/commands/manage-installation.js');
const command3 = require('../src/commands/launcher.js');
const pkg = require('../package.json');
const {initializeCauldron} = require("../src/libs/system");

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
}

async function main() {
    program
        .name('cauldroncli')
        .description('CLI For Managing Minecraft')
        .version(pkg.version)
    //.option('-d, --debug', 'output extra debugging information')

    await initializeCauldron()
    await loadCommands(); // Load other commands

    program.parse(process.argv);

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