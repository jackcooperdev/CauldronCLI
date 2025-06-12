#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

const command1 = require('../src/commands/websockets.js');
const command2 = require('../src/commands/login-to-api.js');
const command3 = require('../src/commands/manage-installation.js');
const command4 = require('../src/commands/minecraft-auth.js');
const command5 = require('../src/commands/launcher.js');

const pkg = require('../package.json');

async function loadCommands() {
    // Add commands from each imported module
    for (const commandName in command1) {
        if (command1[commandName] instanceof Command) {
            program.addCommand(command1[commandName]);
        }
    }

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

    await loadCommands(); // Load other commands

    program.parse(process.argv);

}

main();