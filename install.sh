#!/bin/sh
# CauldronCLI installer for macOS and Linux
#
#   curl -fsSL https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.sh | sh
#
# Install a specific version:
#
#   curl -fsSL https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.sh | sh -s -- v0.7.1
#
# Set CAULDRONCLI_INSTALL to change the install folder (default: ~/.cauldroncli/bin)

set -eu

REPO="jackcooperdev/CauldronCLI"
VERSION="${1:-latest}"
INSTALL_DIR="${CAULDRONCLI_INSTALL:-$HOME/.cauldroncli/bin}"

fail() {
    echo "error: $1" >&2
    exit 1
}

# Work out which binary to download

os=$(uname -s)
arch=$(uname -m)

case "$os" in
    Darwin)
        # uname reports x86_64 when the shell runs under Rosetta on Apple Silicon
        if [ "$arch" = "x86_64" ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
            arch="arm64"
        fi
        case "$arch" in
            arm64) target="aarch64-apple-darwin" ;;
            x86_64) target="x86_64-apple-darwin" ;;
            *) fail "Unsupported architecture: $arch" ;;
        esac
        ;;
    Linux)
        case "$arch" in
            x86_64 | amd64) target="x86_64-unknown-linux-gnu" ;;
            *) fail "Unsupported architecture: $arch (only x64 Linux is supported)" ;;
        esac
        ;;
    *)
        fail "Unsupported system: $os. On Windows use install.ps1"
        ;;
esac

if [ "$VERSION" = "latest" ]; then
    url="https://github.com/$REPO/releases/latest/download/cauldroncli-$target"
else
    case "$VERSION" in
        v*) ;;
        *) VERSION="v$VERSION" ;;
    esac
    url="https://github.com/$REPO/releases/download/$VERSION/cauldroncli-$target"
fi

# Download

mkdir -p "$INSTALL_DIR"
exe="$INSTALL_DIR/cauldroncli"
tmp="$exe.download"

echo "Downloading CauldronCLI ($VERSION, $target)..."
if command -v curl >/dev/null 2>&1; then
    curl -fL --progress-bar -o "$tmp" "$url" || fail "Download failed: $url"
elif command -v wget >/dev/null 2>&1; then
    wget -q --show-progress -O "$tmp" "$url" || fail "Download failed: $url"
else
    fail "curl or wget is required"
fi

chmod +x "$tmp"
mv -f "$tmp" "$exe"

installed=$("$exe" --version 2>/dev/null) || fail "CauldronCLI was downloaded but failed to run"
echo "Installed CauldronCLI $installed to $exe"

# Add to PATH

case ":$PATH:" in
    *":$INSTALL_DIR:"*)
        echo "Run \"cauldroncli --help\" to get started"
        exit 0
        ;;
esac

line="export PATH=\"$INSTALL_DIR:\$PATH\""
shell_name=$(basename "${SHELL:-sh}")

case "$shell_name" in
    zsh) profile="${ZDOTDIR:-$HOME}/.zshrc" ;;
    bash)
        if [ "$os" = "Darwin" ]; then
            profile="$HOME/.bash_profile"
        else
            profile="$HOME/.bashrc"
        fi
        ;;
    fish)
        profile="$HOME/.config/fish/conf.d/cauldroncli.fish"
        line="fish_add_path \"$INSTALL_DIR\""
        mkdir -p "$(dirname "$profile")"
        ;;
    *) profile="$HOME/.profile" ;;
esac

if [ -f "$profile" ] && grep -qF "$INSTALL_DIR" "$profile"; then
    echo "$INSTALL_DIR is already added to PATH in $profile"
else
    printf '\n# CauldronCLI\n%s\n' "$line" >> "$profile"
    echo "Added $INSTALL_DIR to PATH in $profile"
fi

echo
echo "Restart your terminal, or run the following to use CauldronCLI now:"
echo
echo "  $line"
echo
echo "Then run \"cauldroncli --help\" to get started"
