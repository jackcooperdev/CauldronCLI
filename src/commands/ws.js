// wsCommands.js
const { Command } = require('commander');
const { fork } = require('child_process');
const path = require('path');
const {writeFileSync, readFileSync, unlinkSync} = require("node:fs");
const homedir = require('os').homedir();
const pidFilePath = path.join(homedir,'wsServer.pid');
module.exports = {
    websocket: new Command('websocket')
        .description('Starts a WebSocket server in a separate process.')
        .argument('[port]', 'The port to listen on (default: 8080)', 8080)
        .action(async (port) => {
            const serverPath = path.join(__dirname, '../','libs','ws.js');
            const serverProcess = fork(serverPath, [port], { detached: true, stdio: 'ignore' }); // Detach and ignore stdio

            serverProcess.unref(); // unreference the child process
            writeFileSync(pidFilePath, serverProcess.pid.toString());

            console.log(`WebSocket server process started on port ${port}`);

            process.exit(0);
        }),

    stopws: new Command('stopws')
        .description('Stops the WebSocket server process.')
        .action(async () => {
            try {
                const pid = parseInt(readFileSync(pidFilePath, 'utf8')); // Read the PID
                process.kill(pid, 'SIGINT'); // Kill the process

                unlinkSync(pidFilePath); // Remove the PID file

                console.log(`WebSocket server process (PID: ${pid}) stopped.`);
            } catch (err) {
                console.log(err)
                console.log('WebSocket server was not running or PID file not found.');
            }
        }),
};