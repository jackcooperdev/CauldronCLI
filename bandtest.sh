node build.js
pkg dist/cli.cjs \
  --targets node20-macos-x64,node20-macos-arm64 \
  --output cauldroncli --debug
./cauldroncli-arm64 quick-launch -v release
