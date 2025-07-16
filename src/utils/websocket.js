// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('WebSocket server script started execution!');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');

const port = 8080;
const cliLocation =  'cauldroncli';
const server = new WebSocketServer({
    port: port
});
console.log(process.argv);

// REMOVED: let sockets = []; // No longer needed

server.on('connection', function (socket) {
    // REMOVED: sockets.push(socket); // No longer needed

    // When you receive a message, send that message to every socket.
    socket.on('message', async function (msg) {
        try {
            console.log('Received message:', msg.toString());

            let actualCommand;
            try {
                actualCommand = JSON.parse(msg);
                console.log("Parsed command object:", actualCommand);
            } catch (parseError) {
                console.error("Failed to parse message as JSON:", parseError);
                socket.send(JSON.stringify({
                    status: 'error',
                    message: `Invalid message format: ${parseError.message}. Expected JSON.`,
                    receivedMessage: msg.toString()
                }));
                return;
            }

            if (!actualCommand || typeof actualCommand.command !== 'string' || !Array.isArray(actualCommand.params)) {
                socket.send(JSON.stringify({
                    status: 'error',
                    message: 'Invalid command format. Expected { "command": "your_command", "params": ["arg1", "arg2"] }',
                    receivedObject: actualCommand
                }));
                return;
            }

            const commandToExecute = 'cmd.exe';
            // Add Headless Argument

            actualCommand.params.push('-n')

            const commandArgs = ['/c',cliLocation, actualCommand.command, ...actualCommand.params];

            console.log(commandArgs);

            const child = spawn(commandToExecute, commandArgs, { windowsHide: true });

            // Add timeout for robustness, even if commands usually finish
            const timeout = setTimeout(() => {
                console.warn(`Child process for command "${actualCommand.command}" timed out. Killing...`);
                child.kill();
                socket.send(JSON.stringify({
                    status: 'error',
                    message: `Command "${actualCommand.command}" timed out.`,
                    exitCode: null
                }));
            }, 60000); // 60 seconds timeout

            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');

            child.stdout.on('data', (chunk) => {
                console.log('stdout chunk:', chunk);

                let response = {
                    status: 'data-chunk',
                    command: `${actualCommand.command} ${actualCommand.params.join(' ')}`,
                    chunk: chunk
                };
                socket.send(JSON.stringify(response));
            });

            child.stderr.on('data', (chunk) => {
                console.log('stderr chunk:', chunk);
                let response = {
                    status: 'info-chunk',
                    command: `${actualCommand.command} ${actualCommand.params.join(' ')}`,
                    chunk: chunk
                };
                socket.send(JSON.stringify(response));
            });

            child.on('error', (err) => {
                clearTimeout(timeout); // Clear timeout on error too
                console.error('Failed to start child process:', err);
                socket.send(JSON.stringify({
                    status: 'error',
                    message: `Failed to start command: ${err.message}`
                }));
            });

            child.on('close', (code) => {
                clearTimeout(timeout); // Clear the timeout when the process closes normally
                console.log(`Child process exited with code ${code}`);

                let response;
                if (code === 0) {
                    response = {
                        status: 'success',
                        command: `${actualCommand.command} ${actualCommand.params.join(' ')}`,
                        exitCode: code
                    };
                } else {
                    response = {
                        status: 'error',
                        command: `${actualCommand.command} ${actualCommand.params.join(' ')}`,
                        message: `Command exited with code ${code}`,
                        exitCode: code
                    };
                }
                socket.send(JSON.stringify(response));
            });

        } catch (error) {
            console.error("Error in WebSocket message handler:", error);
            // Send a generic error back to the client if something unexpected goes wrong
            socket.send(JSON.stringify({
                status: 'error',
                message: `An unexpected server error occurred: ${error.message}`
            }));
        }
    });

    // REMOVED: socket.on('close', function () { sockets = sockets.filter(s => s !== socket); }); // No longer needed
});