param(
    [Parameter(Mandatory=$true)]
    [string]$Tag,

    [string]$Target = "windows-x64-20.10.0"
)

# Fail fast on any error
$ErrorActionPreference = "Stop"

Write-Host "=== Cauldron Release Script ==="
Write-Host "Tag: $Tag"
Write-Host "Target: $Target"

# Detect CI environment
$IsCI = $env:GITHUB_ACTIONS -eq "true"

# Validate tag format (v1.2.3)
if ($Tag -notmatch "^v\d+\.\d+\.\d+$") {
    Write-Host "ERROR: Tag must be in format vX.Y.Z (e.g. v1.2.3)"
    exit 1
}

# Names
$BinaryName = "cauldroncli.exe"
$BinaryNameWeb = "cauldronws.exe"
$InstallerName = "cauldron-installer.exe"

# Paths
$EntryFile = "../dist/cli.cjs"
$EntryFileWeb = "../src/utils/websocket.js"
$InstallerScript = "cauldron_installer.iss"
$outDir = "out"

# --- Check required tools ---
foreach ($tool in @("git", "npx")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# gh is optional locally but required in CI
if ($IsCI -or (Get-Command gh -ErrorAction SilentlyContinue)) {
    $HasGh = $true
} else {
    $HasGh = $false
}

# Inno Setup (auto-resolve path)
try {
    $InnoSetupPath = (Get-Command ISCC.exe -ErrorAction Stop).Source
} catch {
    Write-Host "ERROR: Inno Setup compiler (ISCC.exe) not found in PATH."
    exit 1
}

# --- Clean old artifacts ---
Write-Host "Cleaning old build artifacts..."
Remove-Item $BinaryName -ErrorAction Ignore
Remove-Item $BinaryNameWeb -ErrorAction Ignore
Remove-Item "Output\$InstallerName" -ErrorAction Ignore

# --- Build step ---
Write-Host "Running build.js..."
node ../build.js

if (-not (Test-Path $EntryFile)) {
    Write-Host "ERROR: Entry file $EntryFile not found."
    exit 1
}

# --- Compile binaries ---
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
        Write-Host "Git tag $Tag already exists."
    }
} else {
    Write-Host "CI environment detected - skipping git tagging"
}

# --- GitHub Release ---
if ($HasGh) {
    Write-Host "Checking GitHub release..."

    $releaseCheck = gh release view $Tag 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Release already exists."
    } else {
        Write-Host "Creating release..."
        gh release create $Tag --title "$Tag" --generate-notes
    }

    Write-Host "Uploading binaries..."
    gh release upload $Tag $BinaryName --clobber
    gh release upload $Tag $BinaryNameWeb --clobber
} else {
    Write-Host "Skipping GitHub release (gh CLI not available)"
}

# --- Prepare installer ---
Write-Host "Preparing installer..."

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Copy-Item $BinaryName "$outDir\cauldroncli.exe" -Force
Copy-Item $BinaryNameWeb "$outDir\cauldronws.exe" -Force

# Extract version (remove 'v')
$version = $Tag.TrimStart("v")

# --- Build installer ---
Write-Host "Building installer..."
& $InnoSetupPath $InstallerScript /DAppVersion=$version

# --- Verify installer ---
if (-not (Test-Path "Output\$InstallerName")) {
    Write-Host "ERROR: Installer not found after build."
    exit 1
}

# --- Upload installer ---
if ($HasGh) {
    Write-Host "Uploading installer..."
    gh release upload $Tag "Output\$InstallerName" --clobber
}

Write-Host "=== Release complete ==="