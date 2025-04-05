#!/usr/bin/env node

const { Command } = require('commander');
const { readdir } = require('fs').promises;
const path = require('path');

const program = new Command();

const command1 = require('../src/commands/ws')
const command2 = require('../src/commands/login-to-api')

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
    // Add more command loops for each imported module...
    // for (const commandName in command3) {
    //     if (command3[commandName] instanceof Command) {
    //         program.addCommand(command3[commandName]);
    //     }
    // }
    // for (const commandName in command4) {
    //     if (command4[commandName] instanceof Command) {
    //         program.addCommand(command4[commandName]);
    //     }
    // }

}

async function main() {
    program
        .name('my-cli')
        .description('A CLI application built with Commander.js')
        .version('1.0.0')
        // .option('-d, --debug', 'output extra debugging information')
        // .option('-v, --verbose', 'enable verbose output');

    await loadCommands(); // Load commands dynamically

    program.parse(process.argv);

    // const options = program.opts();
    //
    // if (options.debug) {
    //     console.log('Debug mode is enabled');
    //     console.log('Options:', options);
    // }
}

main();