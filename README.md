# Cauldron CLI

> This Documentation is correct for version [0.8.1](https://github.com/jackcooperdev/CauldronCLI/releases/tag/v0.8.1)
> of CauldronCLI

## What does this do?

CauldronCLI is a command line Minecraft launcher built on [Cauldron Engine](https://docs.cauldronmc.com/engine/introduction). It can launch
vanilla and modded versions of the game, and create, import and manage modpacks.

It is designed to be used directly or controlled by other applications using [headless mode](#headless-mode).

## License Information

This project is licensed under [GPL 3.0](https://choosealicense.com/licenses/gpl-3.0/) so please make sure that your
project follows the license guidelines.

## Setup

### Installer (Recommended)

The installer downloads the latest release, adds it to your `PATH` and keeps it [up to date](#updating).

macOS / Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.sh | sh
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.ps1 | iex
```

Restart your terminal, then check that it works:

```bash
cauldroncli --version
```

| System        | Installed to                         | Added to `PATH` in                                     |
|---------------|--------------------------------------|--------------------------------------------------------|
| macOS / Linux | `~/.cauldroncli/bin/cauldroncli`     | `~/.zshrc`, `~/.bashrc` (`~/.bash_profile` on macOS), fish `conf.d` or `~/.profile` |
| Windows       | `%LOCALAPPDATA%\CauldronCLI\bin`      | User `PATH`                                            |

Installer options:

+ Install a specific version: `sh -s -- v0.7.1` on macOS / Linux, or set `$env:CAULDRONCLI_VERSION = "v0.7.1"`
  before running the Windows installer
+ Set `CAULDRONCLI_INSTALL` to install to a different folder

Running the installer again reinstalls the latest version.

### Manual

Download the binary for your system from the [releases page](https://github.com/jackcooperdev/CauldronCLI/releases).

| System                | File                                    |
|-----------------------|-----------------------------------------|
| Windows (x64)         | `cauldroncli-x86_64-pc-windows-msvc.exe` |
| Linux (x64)           | `cauldroncli-x86_64-unknown-linux-gnu`  |
| macOS (Apple Silicon) | `cauldroncli-aarch64-apple-darwin`      |
| macOS (Intel)         | `cauldroncli-x86_64-apple-darwin`       |

Rename it to `cauldroncli` (`cauldroncli.exe` on Windows) and place it in a folder on your `PATH`.

On Linux and macOS, make the file executable:

```bash
chmod +x cauldroncli
```

### Updating

Release binaries check for a new version once a day and install it automatically. The update is used from the next
command.

+ Run [`cauldroncli update`](https://docs.cauldronmc.com/cli/commands/installation#update) to update straight away
+ Set `AUTO_UPDATE` to `false` in [cauldroncli_admin.json](#cauldroncli_adminjson) to be told about new versions
  without installing them
+ Set the `CAULDRONCLI_NO_UPDATE` environment variable to turn off update checks

Update checks are skipped in [headless mode](#headless-mode) and for the `update`, `reset` and `uninstall` commands.
If the check fails (for example when [offline](#offline-use)), the command runs as normal.

## Quick Start

```bash
# Launch 1.21.1 vanilla in demo mode
cauldroncli start -v 1.21.1

# Launch Forge with a Minecraft account
cauldroncli start -v 1.20.1 -l forge -m <minecraft_access_token>
```

## Commands

| Command                                                    | Description                         |
|------------------------------------------------------------|-------------------------------------|
| [`start`](https://docs.cauldronmc.com/cli/commands/launcher#start)                    | Install and launch Minecraft        |
| [`createMPack`](https://docs.cauldronmc.com/cli/commands/modpacks#creatempack)        | Create a modpack                    |
| [`importMPack`](https://docs.cauldronmc.com/cli/commands/modpacks#importmpack)        | Import a CurseForge / Modrinth pack |
| [`getMPack`](https://docs.cauldronmc.com/cli/commands/modpacks#getmpack)              | List the mods in a modpack          |
| [`modifyMPack`](https://docs.cauldronmc.com/cli/commands/modpacks#modifympack)        | Add or remove mods                  |
| [`list`](https://docs.cauldronmc.com/cli/commands/installation#list)                  | List installed versions             |
| [`reset`](https://docs.cauldronmc.com/cli/commands/installation#reset)                | Reset the Cauldron folder           |
| [`uninstall`](https://docs.cauldronmc.com/cli/commands/installation#uninstall)        | Remove the Cauldron folder          |
| [`update`](https://docs.cauldronmc.com/cli/commands/installation#update)              | Update CauldronCLI                  |

Run `cauldroncli help <command>` to see the options for a command.

## Common Options

Most commands accept the following options.

+ `-g` `--headless`: Skip interactive elements and output JSON. See [Headless Mode](#headless-mode)
+ `-d` `--debug`: Output extra debugging information

> The `uninstall` command uses `-n` for `--headless`.

## Headless Mode

When `--headless` is passed, the CLI writes one JSON object per line to stdout so other applications can read the
output.

| `type`     | Description                    | Example                                                   |
|------------|--------------------------------|-----------------------------------------------------------|
| `event`    | Progress message               | `{"type":"event","message":"..."}`                        |
| `data`     | Data returned by the command   | `{"type":"data","payload":{...}}`                         |
| `complete` | The command finished           | `{"type":"complete","success":true,"payload":{...}}`      |
| `error`    | The command failed             | `{"type":"error","message":"..."}`                        |

## Offline Use

Versions that have been installed while online can be launched without an internet connection:

```bash
# Install while online
cauldroncli start -v 1.21.1 --dry

# Launch later, online or offline
cauldroncli start -v 1.21.1
```

Use [`list`](https://docs.cauldronmc.com/cli/commands/installation#list) to see which versions are installed. See
[Offline Use](https://docs.cauldronmc.com/engine/introduction#offline-use) in the engine docs for more information.

## Configuration

### cauldroncli_admin.json

Created in your home folder on first run.

```json
{
  "FORCE_MODE": false,
  "CAULDRON_PATH": "/home/user/.cauldron",
  "RESOURCE_SERVER": "https://resources.cauldronmc.com",
  "AUTO_UPDATE": true
}
```

+ `CAULDRON_PATH`: Where Cauldron stores games, modpacks and sessions.
  See [grabPath](https://docs.cauldronmc.com/engine/tools/compat#grabpath) for the default
+ `RESOURCE_SERVER`: Server used to fetch version and loader information
+ `AUTO_UPDATE`: Install new versions automatically. When `false`, a message is shown instead. See
  [Updating](#updating) (Default: `true`)

> Run `cauldroncli uninstall` before changing `CAULDRON_PATH` so the old folder is removed.

### custom_args.json

Place a `custom_args.json` file in the Cauldron folder to apply [overrides](https://docs.cauldronmc.com/engine/controllers/client#overrides) to
every launch.

```json
{
  "jvm": { "ram": "6", "ram_low": "2" },
  "game": {}
}
```

## Information

For information on how a launcher works, this blog post by Ryan Cao explains it brilliantly.
[Inside a Minecraft Launcher](https://ryanccn.dev/posts/inside-a-minecraft-launcher/)

Wiki.vg was a great resource that provided lots of information on how various parts of Minecraft works.
It has been merged into Minecraft Wiki
and can be viewed [here](https://minecraft.wiki/w/Microsoft_authentication#Navigation)
