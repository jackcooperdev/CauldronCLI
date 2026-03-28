param(
    [Parameter(Mandatory=$true)]
    [string]$Tag,

    [string]$Target = "windows-x64-20.10.0"
)

# Fail fast
$ErrorActionPreference = "Stop"

Write-Host "=== Cauldron Release Script ==="
Write-Host "Tag: $Tag"
Write-Host "Target: $Target"

# Detect CI
$IsCI = $env:GITHUB_ACTIONS -eq "true"

# Validate tag
if ($Tag -notmatch "^v\d+\.\d+\.\d+$") {
    Write-Host "ERROR: Tag must be in format vX.Y.Z"
    exit 1
}

# --- Resolve paths relative to script ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir/.."

Write-Host "ScriptDir: $ScriptDir"
Write-Host "RootDir: $RootDir"

# Names
$BinaryName = "cauldroncli.exe"
$BinaryNameWeb = "cauldronws.exe"
$InstallerName = "cauldron-installer.exe"

# Absolute paths
$EntryFile = Join-Path $RootDir "dist/cli.cjs"
$EntryFileWeb = Join-Path $RootDir "src/utils/websocket.js"
$InstallerScript = Join-Path $RootDir "cauldron_installer.iss"
$BuildScript = Join-Path $RootDir "build.js"
$outDir = Join-Path $RootDir "out"

# --- Tool checks ---
foreach ($tool in @("git", "npx", "node")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Required tool '$tool' not found in PATH."
        exit 1
    }
}

# GitHub CLI optional
$HasGh = $false
if ($IsCI -or (Get-Command gh -ErrorAction SilentlyContinue)) {
    $HasGh = $true
}

# Inno Setup
try {
    $InnoSetupPath = (Get-Command ISCC.exe -ErrorAction Stop).Source
} catch {
    Write-Host "ERROR: Inno Setup (ISCC.exe) not found in PATH."
    exit 1
}

# --- Clean old artifacts ---
Write-Host "Cleaning old build artifacts..."
Remove-Item (Join-Path $RootDir $BinaryName) -ErrorAction Ignore
Remove-Item (Join-Path $RootDir $BinaryNameWeb) -ErrorAction Ignore
Remove-Item (Join-Path $RootDir "Output\$InstallerName") -ErrorAction Ignore

# --- Build ---
Write-Host "Running build.js..."
if (-not (Test-Path $BuildScript)) {
    Write-Host "ERROR: build.js not found at $BuildScript"
    exit 1
}
node $BuildScript

# Verify output
if (-not (Test-Path $EntryFile)) {
    Write-Host "ERROR: Entry file not found: $EntryFile"
    exit 1
}

# --- Compile binaries ---
Set-Location $RootDir

Write-Host "Building CLI binary..."
npx --yes nexe@5.0.0-beta.4 $EntryFile -t $Target -o $BinaryName --build

Write-Host "Building WebSocket binary..."
npx --yes nexe@5.0.0-beta.4 $EntryFileWeb -t $Target -o $BinaryNameWeb --build

# --- Git tagging (skip in CI) ---
if (-not $IsCI) {
    $tagExists = git tag --list $Tag

    if (-not $tagExists) {
        Write-Host "Creating git tag $Tag..."
        git tag $Tag
        git push origin $Tag
    } else {
        Write-Host "Git tag already exists."
    }
} else {
    Write-Host "CI detected - skipping git tagging"
}

# --- GitHub Release ---
if ($HasGh) {
    Write-Host "Checking GitHub release..."

    $releaseCheck = gh release view $Tag 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating release..."
        gh release create $Tag --title "$Tag" --generate-notes
    } else {
        Write-Host "Release already exists."
    }

    Write-Host "Uploading binaries..."
    gh release upload $Tag $BinaryName --clobber
    gh release upload $Tag $BinaryNameWeb --clobber
} else {
    Write-Host "Skipping GitHub release (gh not available)"
}

# --- Prepare installer ---
Write-Host "Preparing installer..."

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Copy-Item $BinaryName (Join-Path $outDir "cauldroncli.exe") -Force
Copy-Item $BinaryNameWeb (Join-Path $outDir "cauldronws.exe") -Force

# Version
$version = $Tag.TrimStart("v")

# --- Build installer ---
Write-Host "Building installer..."
& $InnoSetupPath $InstallerScript /DAppVersion=$version

# Verify installer
$InstallerOutput = Join-Path $RootDir "Output\$InstallerName"
if (-not (Test-Path $InstallerOutput)) {
    Write-Host "ERROR: Installer not found after build."
    exit 1
}

# Upload installer
if ($HasGh) {
    Write-Host "Uploading installer..."
    gh release upload $Tag $InstallerOutput --clobber
}

Write-Host "=== Release complete ==="