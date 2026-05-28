// build.js
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;

const entry = path.join(rootDir, 'bin/index.js');
const outfile = path.join(rootDir, 'dist/cli.cjs');

// Ensure dist exists
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

async function build() {
    await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: outfile,
        external: ['node:*','esbuild','@aws-sdk/client-s3','@napi-rs/keyring'],
        minify: false,
        sourcemap: true,
        target: ['node20'],
    }).then(() => {
        console.log('Build complete!');
        console.log('Entry:', entry);
        console.log('Output:', outfile);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
    

}

build()