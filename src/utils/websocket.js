const { WebSocketServer } = require('ws');
const { handlePing } = require("../libs/socketCommander.js");
const port = process.argv[2] ? parseInt(process.argv[2], 10) : 8080;
const server = new WebSocketServer({
    port: port
});

let commandMap = {
    "ping":handlePing
}

let sockets = [];
server.on('connection', function (socket) {
    sockets.push(socket);

    // When you receive a message, send that message to every socket.
    socket.on('message', async function (msg) {
        if (commandMap[msg]) {
            console.log(msg);
            let response = await commandMap[msg]();
            sockets.forEach(s => s.send(response));
        }

    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function () {
        sockets = sockets.filter(s => s !== socket);
    });
});