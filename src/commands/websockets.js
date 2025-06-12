// wsCommands.js
const { Command } = require('commander');
const os = require('os');
const { fork } = require('child_process');
const path = require('path');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');

// Use the current working directory as a base for relative paths
const homedir = os.homedir();
const pidFilePath = path.join(homedir, 'wsServer.pid');

// Calculate serverPath relative to the CLI root (assuming this file is in ./commands/)
const serverPath = path.join(process.cwd(), 'utils', 'websocket.js');

module.exports = {
    websocket: new Command('websocket')
        .description('Starts a WebSocket server in a separate process.')
        .argument('[port]', 'The port to listen on (default: 9500)', 9500)
        .action(async (port) => {
            console.log(serverPath);
            const serverProcess = fork(serverPath, [port], {
                detached: true,
                stdio: 'inherit',
            });

            serverProcess.on('error', (err) => {
                console.error('Failed to start WebSocket server process:', err);
                process.exit(1);
            });

            serverProcess.unref(); // Allow process to continue running after CLI exits
            writeFileSync(pidFilePath, serverProcess.pid.toString());

            console.log(`WebSocket server process started on port ${port}`);
            process.exit(0);
        }),

    stopws: new Command('stopws')
        .description('Stops the WebSocket server process.')
        .action(async () => {
            try {
                const pid = parseInt(readFileSync(pidFilePath, 'utf8'));
                process.kill(pid, 'SIGINT');
                unlinkSync(pidFilePath);
                console.log(`WebSocket server process (PID: ${pid}) stopped.`);
            } catch (err) {
                console.log('WebSocket server was not running or PID file not found.');
            }
            process.exit(0);
        }),
};
