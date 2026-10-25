# CauldronCLI installer for Windows
#
#   irm https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.ps1 | iex
#
# Install a specific version:
#
#   $env:CAULDRONCLI_VERSION = "v0.7.1"; irm https://raw.githubusercontent.com/jackcooperdev/CauldronCLI/master/install.ps1 | iex
#
# Set $env:CAULDRONCLI_INSTALL to change the install folder (default: %LOCALAPPDATA%\CauldronCLI\bin)

& {
    $ErrorActionPreference = 'Stop'
    $Repo = 'jackcooperdev/CauldronCLI'
    $Version = if ($env:CAULDRONCLI_VERSION) { $env:CAULDRONCLI_VERSION } else { 'latest' }
    $InstallDir = if ($env:CAULDRONCLI_INSTALL) { $env:CAULDRONCLI_INSTALL } else { Join-Path $env:LOCALAPPDATA 'CauldronCLI\bin' }
    $Asset = 'cauldroncli-x86_64-pc-windows-msvc.exe'

    # x64 binaries also run on Windows on ARM through emulation
    if (-not [Environment]::Is64BitOperatingSystem) {
        throw 'CauldronCLI requires 64-bit Windows'
    }

    if ($Version -eq 'latest') {
        $Url = "https://github.com/$Repo/releases/latest/download/$Asset"
    } else {
        if (-not $Version.StartsWith('v')) { $Version = "v$Version" }
        $Url = "https://github.com/$Repo/releases/download/$Version/$Asset"
    }

    # Download

    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    $Exe = Join-Path $InstallDir 'cauldroncli.exe'
    $Temp = Join-Path $InstallDir 'cauldroncli.download.exe'

    # Windows PowerShell 5.1 does not enable TLS 1.2 by default
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

    Write-Host "Downloading CauldronCLI ($Version)..."
    $ProgressPreference = 'SilentlyContinue' # The progress bar makes Invoke-WebRequest very slow
    try {
        Invoke-WebRequest -Uri $Url -OutFile $Temp -UseBasicParsing
    } catch {
        throw "Download failed: $Url ($($_.Exception.Message))"
    }

    try {
        Move-Item -Force -Path $Temp -Destination $Exe
    } catch {
        Remove-Item -Force -ErrorAction SilentlyContinue $Temp
        throw "Could not replace $Exe. Close any running copies of CauldronCLI and try again"
    }

    $Installed = & $Exe --version
    if ($LASTEXITCODE -ne 0) {
        throw 'CauldronCLI was downloaded but failed to run'
    }
    Write-Host "Installed CauldronCLI $Installed to $Exe"

    # Add to the user PATH. Read from the registry without expanding so entries
    # like %USERPROFILE%\bin are kept as they are

    $Key = Get-Item -Path 'HKCU:\Environment'
    $UserPath = $Key.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
    $Entries = $UserPath -split ';' | Where-Object { $_ }

    if ($Entries -notcontains $InstallDir) {
        $NewPath = (@($Entries) + $InstallDir) -join ';'
        Set-ItemProperty -Path 'HKCU:\Environment' -Name 'Path' -Value $NewPath -Type ExpandString

        # Setting a variable through .NET broadcasts the change so new terminals pick up the new PATH
        [Environment]::SetEnvironmentVariable('CAULDRONCLI_PATH_REFRESH', '1', 'User')
        [Environment]::SetEnvironmentVariable('CAULDRONCLI_PATH_REFRESH', $null, 'User')

        Write-Host "Added $InstallDir to your PATH"
    }

    # Make it available in this terminal too
    if (($env:Path -split ';') -notcontains $InstallDir) {
        $env:Path = "$env:Path;$InstallDir"
    }

    Write-Host ''
    Write-Host 'Run "cauldroncli --help" to get started. Other open terminals need to be restarted first'
}
