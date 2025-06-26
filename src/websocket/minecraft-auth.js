const {startMCAccount} = require("../libs/minecraft-auth");


async function startMCLogin() {
    let authData = await startMCAccount()
    return authData.data;
}

module.exports = { startMCLogin }