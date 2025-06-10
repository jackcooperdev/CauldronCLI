// build.js
import { build } from 'esbuild';

build({
    entryPoints: ['bin/index.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/cli.cjs',
    external: ['node:*'], // 👈 native modules marked external
    minify: false,
    sourcemap: true,
    target: ['node20'],
}).then(() => {
    console.log('Build complete!');
}).catch(() => process.exit(1));
