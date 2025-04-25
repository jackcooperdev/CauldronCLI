#!/usr/bin/env node
import { Command } from 'commander';
import 'fs';
import path from 'path';

const program = new Command();

import command1 from '../src/commands/websockets.js';
import command2 from '../src/commands/login-to-api.js';
import command3 from '../src/commands/manage-installation.js';
import command4 from '../src/commands/minecraft-auth.js';
import command5 from '../src/commands/launcher.js';


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
        .name('my-cli')
        .description('A CLI application built with Commander.js')
        .version('1.0.0')
        //.option('-d, --debug', 'output extra debugging information')


    await loadCommands(); // Load other commands

    program.parse(process.argv);

}

main();