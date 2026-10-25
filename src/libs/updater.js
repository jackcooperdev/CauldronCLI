const { getEnginePath, getAutoUpdate } = require('../utils/enviromentManager.js');

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const axios = require('axios');
const pkg = require('../../package.json');

// Set Constants

const RELEASE_API = 'https://api.github.com/repos/jackcooperdev/CauldronCLI/releases/latest';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const STATE_FILE = path.join(getEnginePath(), 'cli_update.json');

// Release asset names for each platform (see .github/workflows/release.yml)
const ASSETS = {
    'win32-x64': 'cauldroncli-x86_64-pc-windows-msvc.exe',
    'linux-x64': 'cauldroncli-x86_64-unknown-linux-gnu',
    'darwin-arm64': 'cauldroncli-aarch64-apple-darwin',
    'darwin-x64': 'cauldroncli-x86_64-apple-darwin',
};

// isPackaged()
// True when running as a release binary (not through node / npm)

function isPackaged() {
    if (process.pkg) {
        return true;
    }
    try {
        return require('node:sea').isSea();
    } catch (e) {
        return false;
    }
}

// Path the new binary is downloaded to before it replaces the current one.
// Kept as .exe on Windows so it can be run to check it works

function getTempPath() {
    if (process.platform === 'win32') {
        return process.execPath.replace(/\.exe$/i, '') + '.new.exe';
    }
    return process.execPath + '.new';
}

function getAssetName() {
    return ASSETS[`${process.platform}-${process.arch}`];
}

// isNewer(latest, current)
// Compares two version strings (with or without a leading v)

function isNewer(latest, current) {
    const a = latest.replace(/^v/, '').split('-')[0].split('.').map(Number);
    const b = current.replace(/^v/, '').split('-')[0].split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((a[i] || 0) !== (b[i] || 0)) {
            return (a[i] || 0) > (b[i] || 0);
        }
    }
    return false;
}

function readState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE).toString());
    } catch (e) {
        return {};
    }
}

function writeState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } catch (e) {
        // Not being able to save the check time is not fatal
    }
}

// getLatestRelease()
// Returns the latest release, or false if it has no binary for this platform yet

async function getLatestRelease(timeout = 10000) {
    const res = await axios.get(RELEASE_API, {
        timeout,
        headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'cauldroncli' },
    });
    const asset = res.data.assets.find(a => a.name === getAssetName());
    if (!asset) {
        return false;
    }
    return {
        version: res.data.tag_name.replace(/^v/, ''),
        url: asset.browser_download_url,
        digest: asset.digest,
        notes: res.data.html_url,
    };
}

// checkForUpdate(force)
// Returns the latest release if it is newer than this one, otherwise false.
// Unless forced, the release server is only asked once every 24 hours.

async function checkForUpdate(force = false) {
    const state = readState();
    if (!force && state.lastCheck && Date.now() - state.lastCheck < CHECK_INTERVAL) {
        return state.latest && isNewer(state.latest.version, pkg.version) ? state.latest : false;
    }
    const latest = await getLatestRelease(force ? 10000 : 3000);
    writeState({ lastCheck: Date.now(), latest });
    return latest && isNewer(latest.version, pkg.version) ? latest : false;
}

// installUpdate(release)
// Downloads the release and replaces the running binary with it

async function installUpdate(release) {
    const target = process.execPath;
    const temp = getTempPath();
    const old = target + '.old';

    const res = await axios.get(release.url, {
        responseType: 'arraybuffer',
        timeout: 5 * 60 * 1000,
        headers: { 'User-Agent': 'cauldroncli' },
    });
    const data = Buffer.from(res.data);

    if (release.digest && release.digest.startsWith('sha256:')) {
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        if (hash !== release.digest.slice(7)) {
            throw new Error('Downloaded update is corrupt (hash mismatch). Please try again');
        }
    }

    try {
        fs.writeFileSync(temp, data, { mode: 0o755 });
    } catch (e) {
        if (e.code === 'EACCES' || e.code === 'EPERM') {
            throw new Error(`Permission denied writing to ${path.dirname(target)}. Re-run with elevated permissions or reinstall with the installer`);
        }
        throw e;
    }

    // Make sure the new binary runs before replacing the current one
    try {
        const out = execFileSync(temp, ['--version'], {
            timeout: 60000,
            env: { ...process.env, CAULDRONCLI_NO_UPDATE: '1' },
        }).toString().trim();
        if (out !== release.version) {
            throw new Error(`reported version ${out}`);
        }
    } catch (e) {
        fs.rmSync(temp, { force: true });
        throw new Error(`Downloaded update failed to start (${e.message})`);
    }

    if (process.platform === 'win32') {
        // Windows cannot overwrite a running exe but can rename it. It is removed on the next start
        fs.rmSync(old, { force: true });
        fs.renameSync(target, old);
        try {
            fs.renameSync(temp, target);
        } catch (e) {
            fs.renameSync(old, target);
            throw e;
        }
    } else {
        fs.renameSync(temp, target);
    }

    writeState({ lastCheck: Date.now(), latest: release });
    return release.version;
}

// cleanupUpdate()
// Removes files left over from a previous update

function cleanupUpdate() {
    if (!isPackaged()) {
        return;
    }
    for (const leftover of [process.execPath + '.old', getTempPath()]) {
        try {
            fs.rmSync(leftover, { force: true });
        } catch (e) {
            // Still in use, try again next time
        }
    }
}

// autoUpdate()
// Run before interactive commands. Installs (AUTO_UPDATE: true) or announces new releases.
// Never throws, so being offline does not stop the CLI from working.

async function autoUpdate() {
    if (!isPackaged() || !getAssetName() || process.env.CAULDRONCLI_NO_UPDATE) {
        return;
    }
    try {
        const release = await checkForUpdate();
        if (!release) {
            return;
        }
        // Fall back to a notice if installing this version already failed today
        if (!getAutoUpdate() || readState().failedVersion === release.version) {
            console.log(`CauldronCLI ${release.version} is available (current: ${pkg.version}). Run "cauldroncli update" to install it`);
            return;
        }
        console.log(`Updating CauldronCLI ${pkg.version} -> ${release.version}...`);
        await installUpdate(release);
        console.log(`Updated to ${release.version}. The update applies from the next command\n`);
    } catch (e) {
        // Ignore failures (offline, rate limited etc.). The next check is in 24 hours
        const state = readState();
        if (state.latest && isNewer(state.latest.version, pkg.version)) {
            writeState({ ...state, failedVersion: state.latest.version });
            console.log(`Could not update CauldronCLI: ${e.message}\n`);
        }
    }
}

module.exports = { isPackaged, getAssetName, checkForUpdate, installUpdate, cleanupUpdate, autoUpdate };
