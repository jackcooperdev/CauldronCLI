param(
    [string]$Tag
)

if (-not $Tag) {
    Write-Host "Usage: .\release.ps1 v1.2.3"
    exit 1
}

$BinaryName = "cauldroncli.exe"
$InstallerName = "cauldron-installer.exe"
$Target = "windows-x64-20.10.0"
$EntryFile = "../dist/cli.cjs" # This is likely the output of your build.js
$InstallerScript = "cauldron_installer.iss"

# Check for required tools
foreach ($tool in @("gh", "git", "npx")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: Required tool '$tool' is not installed or not in PATH."
        exit 1
    }
}

# Check for Inno Setup compiler path (default install location)
$InnoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $InnoSetupPath)) {
    Write-Host "ERROR: Inno Setup compiler not found at $InnoSetupPath"
    Write-Host "Please install Inno Setup or update the script with correct path."
    exit 1
}

# --- ADDED STEP: Run your build.js script ---
Write-Host "Running node build.js to prepare entry file..."
node ../build.js
# ---------------------------------------------

# Check entry file exists (this check remains important after build.js)
if (-not (Test-Path $EntryFile)) {
    Write-Host "ERROR: Entry file $EntryFile not found. Ensure build.js creates it."
    exit 1
}

# Build binary with nexe
Write-Host "Building $BinaryName with nexe..."
npx --yes nexe@5.0.0-beta.4 $EntryFile -t $Target -o $BinaryName --build

# Create git tag and push if it doesn't exist
$tagExists = git tag --list $Tag
if (-not $tagExists) {
    Write-Host "Creating git tag $Tag..."
    git tag $Tag
    git push origin $Tag
} else {
    Write-Host "Git tag $Tag already exists."
}

# Create GitHub release if needed
$releaseCheck = gh release view $Tag 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists."
} else {
    Write-Host "Creating GitHub release $Tag..."
    gh release create $Tag --title "$Tag" --notes "Release $Tag"
}

# Upload binary to release
Write-Host "Uploading $BinaryName to release $Tag..."
gh release upload $Tag $BinaryName --clobber

# Prepare installer

# Copy binary to 'out' folder with expected filename for installer script
$outDir = "out"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
Copy-Item $BinaryName "$outDir\cauldroncli.exe" -Force

# Update the AppVersion in installer script (remove leading 'v' if present)
$version = $Tag.TrimStart("v")
(Get-Content $InstallerScript) -replace 'AppVersion=.*', "AppVersion=$version" | Set-Content $InstallerScript

# Build installer with Inno Setup
Write-Host "Building installer with Inno Setup..."
& $InnoSetupPath $InstallerScript

# Check installer exists
if (-not (Test-Path Output/$InstallerName)) {
    Write-Host "ERROR: Installer file $InstallerName not found after build."
    exit 1
}

# Upload installer to release
Write-Host "Uploading installer $InstallerName to release $Tag..."
gh release upload $Tag Output/$InstallerName --clobber

Write-Host "Done! Binary and installer uploaded to release $Tag."