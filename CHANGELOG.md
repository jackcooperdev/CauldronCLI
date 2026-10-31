# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.8.1] - 2026-10-31

### Changed

- Updated CauldronEngine to 0.16.0. Versions without a log4j config (1.5.2 and older) now show their game log in the
  terminal when launched, like newer versions
- Updated axios to 1.21.0 and pkg to 6.24.0

### Fixed

- Launching on Windows (from CauldronEngine 0.16.0)
- Launching on Linux, which tried to run `javaw` instead of `java` (from CauldronEngine 0.16.0)

## [v0.8.0] - 2026-10-26

### Added

- Installers that download the latest release and add it to `PATH`:
  `install.sh` (macOS / Linux) and `install.ps1` (Windows)
- `update` command to update CauldronCLI to the latest release (`--check` only checks)
- Automatic updates. Release binaries check for a new version once a day and install it before running a command.
  Skipped in headless mode, and failures (such as being offline) are ignored
- `AUTO_UPDATE` option in `cauldroncli_admin.json`. Set it to `false` to be told about updates instead of
  installing them
- `CAULDRONCLI_NO_UPDATE` environment variable to turn off update checks

### Changed

- Updated CauldronEngine to 0.15.0. Installing a version now shows a progress bar for each type of file (Client,
  Libraries, Java, Assets) with how many files have been checked and downloaded. Not shown in headless mode
- Launching without `--account` logs the demo mode message as a warning instead of an error

### Fixed

- `start` with a saved modpack logging `Starting Minecraft Version: undefined`. The log now shows the modpack's
  Minecraft version and loader

### Removed

- Unused `nssm.exe` and unused internal code

## [v0.7.1] - 2026-10-25

### Changed

- Updated CauldronEngine to 0.14.1

## [v0.7.0] - 2026-10-24

### Added

- `list` command to list installed versions (`--headless` returns them as JSON)
- Offline launching. Versions installed while online can be launched without an internet connection
  (requires CauldronEngine 0.14.0)
- `release` and `snapshot` can be used as the version for loaders as well as vanilla

### Changed

- Updated CauldronEngine to 0.14.0
- `Started Session` is only logged when the game is launched interactively

### Fixed

- `start --dry` launching the game instead of only installing it


## [v0.6.0] - 2026-10-20

### Changed

- **Breaking:** Updated to CauldronEngine 0.13 (new `client` controller)
- **Breaking:** `start` without `--account` now launches in demo mode
- Updated CauldronModManager to 0.3.0
- Launching a saved modpack uses the modpack's loader and loader version

### Removed

- **Breaking:** `-u` / `--username` option from `start`
- **Breaking:** `--curseforge` and `--modrinth` options from `start`. Use `importMPack` to import modpacks

## [v0.5.5] - 2026-10-12

### Changed

- Updated CauldronEngine to 0.11.3

## [v0.5.4] - 2026-10-11

### Added

- Release binaries for Windows (x64), Linux (x64) and macOS (Apple Silicon and Intel)

### Fixed

- `start` waiting for game logs on versions without a logging config

## [v0.5.3] - 2026-10-08

### Added

- `getMPack` command to list the mods in a modpack
- `modifyMPack` command to add and remove mods

### Changed

- Updated CauldronModManager to 0.2.0
- Updated CauldronEngine to 0.11.2

## [v0.5.2] - 2026-10-06

### Changed

- `start -n <name>` uses an existing modpack without needing `--cache`

## [v0.5.1] - 2026-10-05

### Changed

- Release workflow runs when a release is published

## [v0.5.0] - 2026-10-05

### Added

- `-u` / `--username` option for `start` to play offline as a username (the UUID is looked up from Mojang)
- `-o` / `--overrides` option for `start` (`ram`, `ram_low`, `server_ip`, `username`)
- Launching a saved modpack uses the modpack's Minecraft version and loader

### Changed

- Updated CauldronEngine to 0.11.1 and CauldronModManager to 0.1.2

### Removed

- packwiz. Modpacks are fully handled by CauldronModManager

## [v0.4.1] - 2026-09-30

### Fixed

- Release workflow

## [v0.4.0] - 2026-09-30

### Added

- `createMPack` command to create modpacks
- `importMPack` command to import CurseForge and Modrinth modpacks

### Changed

- **Breaking:** Modpacks moved from packwiz_js to CauldronModManager (`@jackcooperdev/cmm`)
- `start` no longer requires `--mc_version` when launching a saved modpack

### Removed

- `start_server` command

## [v0.3.1] - 2026-08-03

### Fixed

- Modrinth mods not marking an instance as modded
- packwiz installs

### Changed

- Updated CauldronEngine to 0.10.5

## [v0.3.0] - 2026-07-24

### Added

- `start_server` command (experimental)

### Fixed

- packwiz downloads not using the configured resource server

### Changed

- Updated CauldronEngine to 0.10.4

## [v0.2.0] - 2026-06-30

### Added

- Modpacks. `start` can install mods with `--curseforge_mods` / `--modrinth_mods`, or import a modpack with
  `--curseforge` / `--modrinth`

### Changed

- Updated CauldronEngine to 0.9.4 (NeoForge support) and packwiz_js to 1.1.0

## [v0.1.7] - 2026-06-01

### Changed

- Updated CauldronEngine to 0.7.1

## [v0.1.6] - 2026-05-28

### Changed

- `test` command supports headless output

## [v0.1.5] - 2026-05-28

### Changed

- Release workflow

## [v0.1.4] - 2026-05-28

### Added

- `start` command to install and launch Minecraft, with the account passed as a Minecraft access token (`-m`)

### Removed

- **Breaking:** CauldronAPI commands (`login`, `logout`, `login_required`)
- **Breaking:** Minecraft account commands (`add`, `remove`, `refresh`, `list_accounts`)
- **Breaking:** Profile commands (`create_profile`, `list_profiles`, `share`, `add_mods`, `search`)
- **Breaking:** `launch` and `quick-launch` (use `start`)
- Websocket interface
- CauldronAuthentication dependency

### Changed

- Updated CauldronEngine to 0.7.0

## [v0.1.3] - 2026-05-25

> Tagged with package version 0.1.0.

### Changed

- Prompts are loaded only when needed, for faster start up

## [v0.1.2] - 2026-05-25

> Tagged with package version 0.1.0.

### Changed

- Updated dependencies

## [v0.1.1] - 2026-05-25

> Tagged with package version 0.1.0.

### Added

- Headless output for commands
- `search` and `login_required` commands
- Compiled release binaries

### Changed

- Websocket interface improvements
- `launch` deprecated (renamed `launch-depreacted`)
- Updated CauldronEngine to 0.6.6

### Fixed

- Websocket interface
- Profile search
- Loader version bug

# [v0.1.0] - 28-03-2026

## Changed 
- Auth Server From Auth0 to Custom Auth Server (LunariaAuth)
- Updated Dependencies

## [v0.0.3] - 16-07-2025

## Added
- Graceful CTRL-C Handling
- Profile Creation
- Mod Managment (Add-Only For Now)
- Mac Compatability (Beta)
- Split Websocket Functionaility to Seperate Executable
- Check For Install
- Headless Options for commands

## Removed
- Test Command


## [v0.0.2] - 12-06-2025

## Added

- Logout to Uninstall Command
- README
- Changelog

## Changed

- CLI Displays Relavent Information

## Fixed

- Bug meaning credentials weren't being updated in time for API Manager to find them.


[unreleased]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.8.0...HEAD
[v0.8.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.8.0...v0.8.1
[v0.8.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.7.1...v0.8.0
[v0.7.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.7.0...v0.7.1
[v0.7.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.6.0...v0.7.0
[v0.6.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.5...v0.6.0
[v0.5.5]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.4...v0.5.5
[v0.5.4]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.3...v0.5.4
[v0.5.3]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.2...v0.5.3
[v0.5.2]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.1...v0.5.2
[v0.5.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.5.0...v0.5.1
[v0.5.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.4.1...v0.5.0
[v0.4.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.4.0...v0.4.1
[v0.4.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.3.1...v0.4.0
[v0.3.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.7...v0.2.0
[v0.1.7]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.6...v0.1.7
[v0.1.6]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.5...v0.1.6
[v0.1.5]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.4...v0.1.5
[v0.1.4]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.3...v0.1.4
[v0.1.3]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.2...v0.1.3
[v0.1.2]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.1...v0.1.2
[v0.1.1]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.1.0...v0.1.1
[v0.1.0]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.0.3...v0.1.0
[v0.0.3]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.0.2...v0.0.3
[v0.0.2]: https://github.com/jackcooperdev/CauldronCLI/compare/v0.0.1...v0.0.2
