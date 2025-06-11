const fs = require('fs').promises; // For fs/promises
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync('your-strong-password-here', 'salt', 32); // Use a secure key here
const IV_LENGTH = 12; // AES GCM nonce length
const STORAGE_FILE = path.resolve(os.homedir(), '.cauldron_auth_store.json');

async function readStorage() {
    try {
        const data = await fs.readFile(STORAGE_FILE);
        return JSON.parse(data.toString());
    } catch {
        return {};
    }
}

async function writeStorage(storage) {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(storage, null, 2));
}

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data) {
    const bData = Buffer.from(data, 'base64');
    const iv = bData.slice(0, IV_LENGTH);
    const tag = bData.slice(IV_LENGTH, IV_LENGTH + 16);
    const text = bData.slice(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);
    return decrypted.toString('utf8');
}

async function setPassword(service, account, password) {
    const storage = await readStorage();
    if (!storage[service]) storage[service] = {};
    storage[service][account] = encrypt(password);
    await writeStorage(storage);
}

async function getPassword(service, account) {
    const storage = await readStorage();
    if (!storage[service] || !storage[service][account]) return null;
    try {
        return decrypt(storage[service][account]);
    } catch {
        return null;
    }
}

 async function deletePassword(service, account) {
    const storage = await readStorage();
    if (storage[service] && storage[service][account]) {
        delete storage[service][account];
        await writeStorage(storage);
    }
}

module.exports = {setPassword,getPassword,deletePassword};