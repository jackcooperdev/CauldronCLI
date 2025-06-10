param(
    [string]$Tag
)

if (-not $Tag) {
    Write-Host "Usage: .\release.ps1 v1.2.3"
    exit 1
}

$BinaryName = "cauldroncli-win.exe"
$Target = "windows-x64-20.10.0"
$EntryFile = "../dist/cli.cjs"

# Check for GitHub CLI (gh)
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: GitHub CLI (gh) is not installed. Install it from https://cli.github.com/"
    exit 1
}

# Check if entry file exists
if (-not (Test-Path $EntryFile)) {
    Write-Host "ERROR: Entry file $EntryFile not found. Run your build step first."
    exit 1
}

# Build binary with nexe
Write-Host "Building $BinaryName with nexe..."
npx nexe $EntryFile -t $Target -o $BinaryName --build

# Check if git tag exists
$tagExists = git tag --list $Tag
if (-not $tagExists) {
    Write-Host "Creating git tag $Tag..."
    git tag $Tag
    git push origin $Tag
} else {
    Write-Host "Git tag $Tag already exists."
}

# Check if GitHub release exists
$releaseExists = $false
$releaseCheck = gh release view $Tag 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists."
    $releaseExists = $true
} else {
    Write-Host "Creating GitHub release $Tag..."
    gh release create $Tag --title "$Tag" --notes "Release $Tag"
}

# Upload binary to the release
Write-Host "Uploading $BinaryName to release $Tag..."
gh release upload $Tag $BinaryName --clobber

Write-Host "Done. Binary uploaded and ready for CI to build the installer."
