const { Command } = require('commander');

module.exports = {
    addTo: new Command('add')
        .description('Add a new item')
        .argument('<item>', 'The item to add')
        .action((item) => {
            console.log(`Adding item: ${item}`);
            // Your add logic here
        }),

    addTo1: new Command('add1')
        .description('Add a new item')
        .argument('<item>', 'The item to add')
        .action((item) => {
            console.log(`Adding item: ${item}`);
            // Your add logic here
            //fork(join(__dirname,'../','libs','ws'))
        }),
};