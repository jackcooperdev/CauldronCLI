// utils/output.js
function send(message) {
    process.stdout.write(JSON.stringify(message) + '\n');
}

function createOutput(isHeadless) {
    return {
        event: (msg) => {
            if (isHeadless) send({ type: 'event', message: msg });
            else console.log(msg);
        },

        data: (payload) => {
            if (isHeadless) send({ type: 'data', payload });
            else console.log(payload);
        },

        success: (payload = {}) => {
            if (isHeadless) send({ type: 'complete', success: true, payload });
        },

        error: (message) => {
            if (isHeadless) {
                send({ type: 'error', message });
            } else {
                console.error(message);
            }
        }
    };
}

module.exports = { createOutput };