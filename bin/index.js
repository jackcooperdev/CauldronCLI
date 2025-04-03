#!/usr/bin/env node

const { Command } = require('commander');
const { readdir } = require('fs').promises;
const path = require('path');

const program = new Command();

async function loadCommands() {
    const commandsPath = path.join(__dirname, '../', 'src', 'commands');
    try {
        const files = await readdir(commandsPath);

        for (const file of files) {
            if (file.endsWith('.js')) {
                const commandPath = path.join(commandsPath, file);
                const commandModule = require(commandPath);

                // Iterate through named exports and add them as commands
                for (const commandName in commandModule) {
                    if (commandModule[commandName] instanceof Command) {
                        program.addCommand(commandModule[commandName]);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error loading commands:', err);
    }
}

async function main() {
    program
        .name('my-cli')
        .description('A CLI application built with Commander.js')
        .version('1.0.0')
        .option('-d, --debug', 'output extra debugging information')
        .option('-f, --file <path>', 'specify the file to process')
        .option('-t, --timeout <seconds>', 'specify the timeout in seconds', '60')
        .option('-v, --verbose', 'enable verbose output');

    await loadCommands(); // Load commands dynamically

    program.parse(process.argv);

    const options = program.opts();

    if (options.debug) {
        console.log('Debug mode is enabled');
        console.log('Options:', options);
    }
}

main();