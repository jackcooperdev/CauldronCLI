const axios = require('axios');
const os = require("os");

async function findPackwizArtifact() {
    let artifact,bootstrap;
    const platform = os.platform();
    const OWNER = "packwiz";
    const REPO = "packwiz-installer";

    const platformMap = {
        linux: "Linux 64-bit x86",
        win32: "Windows 64-bit",
        darwin: "macOS 64-bit x86",
    };


    const artifactName = platformMap[platform];
    if (!artifactName) {
        throw new Error(`Unsupported platform: ${platform}`);
    }
    artifact = `https://nightly.link/packwiz/packwiz/workflows/go/main/${artifactName}.zip`;

    const ghHeaders = {
        "Accept": "application/vnd.github+json",
    };

    const { data: release } = await axios.get(
        `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
        { headers: ghHeaders }
    );
    // noinspection JSUnresolvedReference
    bootstrap = release.assets[0]?.browser_download_url


    return {artifact,bootstrap}

}

module.exports = {findPackwizArtifact};