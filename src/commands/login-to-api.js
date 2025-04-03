import { program } from "commander";

import { Command } from 'commander';

export const addTo = new Command('add')
    .description('Add a new item')
    .argument('<item>', 'The item to add')
    .action((item) => {
        console.log(`Adding item: ${item}`);
        // Your add logic here
    });

export const addTo1 = new Command('add1')
    .description('Add a new item')
    .argument('<item>', 'The item to add')
    .action((item) => {
        console.log(`Adding item: ${item}`);
        // Your add logic here
    });

