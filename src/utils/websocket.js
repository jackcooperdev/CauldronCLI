const { WebSocketServer } = require('ws');
const { handlePing } = require("../libs/socketCommander.js");
const {reset, setup, uninstall} = require("../websocket/manage-installation");
const {loginToAPI} = require("../websocket/login-to-api");
const port = process.argv[2] ? parseInt(process.argv[2], 10) : 8080;
const server = new WebSocketServer({
    port: port
});

let commandMap = {
    "reset":reset,
    "setup":setup,
    "uninstall":uninstall,
    "login": loginToAPI
}

let sockets = [];
server.on('connection', function (socket) {
    sockets.push(socket);

    // When you receive a message, send that message to every socket.
    socket.on('message', async function (msg) {
        let actualCommand = JSON.parse(msg)
        if (commandMap[actualCommand.command]) {
            let response = await commandMap[actualCommand.command](...actualCommand.params);
            sockets.forEach(s => s.send(response));
        }

    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function () {
        sockets = sockets.filter(s => s !== socket);
    });
});