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
const net = require('net');

const port = 8080;
const tcpPort = 9501;
const cliLocation = 'cauldroncli-dev';

const server = new WebSocketServer({ port });

console.log(`WebSocket server running on ws://localhost:${port}`);

/**
 * Broadcast helper (WS fanout)
 */
function broadcast(payload) {
    const data = JSON.stringify(payload);

    for (const client of server.clients) {
        if (client.readyState === 1) {
            client.send(data);
        }
    }
}

/**
 * TCP SERVER
 */
const tcpServer = net.createServer((socket) => {
    console.log('TCP client connected');

    socket.setEncoding('utf8');

    let buffer = '';

    socket.on('data', (data) => {
        console.log('Received data', data);
        const lines = data.toString().split('\n');

        for (const line of lines) {
            if (!line.trim()) continue;

            const split = line.split(']: ');
            if (!split[1]) continue;

            const state = split[0].split('/')[1];

            const message = split.slice(1).join(']: ');

            broadcast({
                source: 'log4j',
                level: state,
                message
            });
        }
    });

    socket.on('error', (err) => {
        console.error('TCP socket error:', err);
    });

    socket.on('close', () => {
        console.log('TCP client disconnected');
    });
});

tcpServer.listen(tcpPort,'127.0.0.1', () => {
    console.log(`TCP server listening on port ${tcpPort}`);
});
tcpServer.on("listening", () => {
    console.log("LISTENING:", tcpServer.address());
});

tcpServer.on("error", (err) => {
    console.log("TCP SERVER ERROR:", err);
});

/**
 * WS SERVER
 */
server.on('connection', (socket) => {

    socket.on('message', async (msg) => {
        try {
            console.log('Received message:', msg.toString());

            let actualCommand;

            try {
                actualCommand = JSON.parse(msg);
            } catch (parseError) {
                socket.send(JSON.stringify({
                    status: 'error',
                    message: `Invalid JSON: ${parseError.message}`,
                    received: msg.toString()
                }));
                return;
            }

            if (
                !actualCommand ||
                typeof actualCommand.command !== 'string' ||
                !Array.isArray(actualCommand.params)
            ) {
                socket.send(JSON.stringify({
                    status: 'error',
                    message: 'Expected format: { "command": "cmd", "params": [] }',
                    received: actualCommand
                }));
                return;
            }

            if (
                !actualCommand.params.includes('-n') &&
                !actualCommand.params.includes('--headless')
            ) {
                actualCommand.params.push('--headless');
            }

            console.log('Executing:', cliLocation, actualCommand.command, actualCommand.params);

            const child = spawn(cliLocation, [
                actualCommand.command,
                ...actualCommand.params
            ]);



            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');

            let buffer = '';

            child.stdout.on('data', (chunk) => {
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;

                    console.log('stdout line:', line);

                    try {
                        const parsed = JSON.parse(line);

                        broadcast({
                            source: 'cli',
                            status: 'stream',
                            command: actualCommand.command,
                            data: parsed
                        });

                    } catch (e) {
                        broadcast({
                            source: 'cli',
                            status: 'raw',
                            command: actualCommand.command,
                            data: line
                        });
                    }
                }
            });

            child.stderr.on('data', (chunk) => {
                const text = chunk.toString();

                console.log('stderr:', text);

                broadcast({
                    source: 'cli',
                    status: 'stderr',
                    command: actualCommand.command,
                    message: text
                });
            });

            child.on('error', (err) => {
                //clearTimeout(timeout);

                console.error('Failed to start process:', err);

                socket.send(JSON.stringify({
                    status: 'error',
                    command: actualCommand.command,
                    message: `Failed to start: ${err.message}`
                }));
            });

            child.on('close', (code) => {
                //clearTimeout(timeout);

                console.log(`Command "${actualCommand.command}" exited with ${code}`);

                broadcast({
                    source: 'cli',
                    status: code === 0 ? 'complete' : 'error',
                    command: actualCommand.command,
                    exitCode: code
                });
            });

        } catch (error) {
            console.error('WebSocket handler error:', error);

            socket.send(JSON.stringify({
                status: 'error',
                message: `Server error: ${error.message}`
            }));
        }
    });
});