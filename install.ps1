# install.ps1
# Usage: irm https://YOUR_PUBLIC_URL/install.ps1 | iex

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$GITHUB_USER  = "YOUR_GITHUB_USER"
$GITHUB_REPO  = "YOUR_REPO"
$APP_NAME     = "YOUR_APP_NAME"
$SERVICE_NAME = "$APP_NAME-ws"
$INSTALL_DIR  = "C:\Program Files\$APP_NAME"

# ── Helpers ───────────────────────────────────────────────────────────────────

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "`n  ✗ $msg" -ForegroundColor Red
    exit 1
}

function Refresh-Path {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

# ── Prompt for PAT ────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  This is a private release. You need a GitHub Personal Access Token" -ForegroundColor Yellow
Write-Host "  with 'repo' scope to download it." -ForegroundColor Yellow
Write-Host "  Create one at: https://github.com/settings/tokens/new?scopes=repo" -ForegroundColor Yellow
Write-Host ""

$patSecure = Read-Host "Enter your GitHub PAT" -AsSecureString
$pat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)
)

if ([string]::IsNullOrWhiteSpace($pat)) {
    Write-Fail "No PAT provided."
}

$headers = @{
    Authorization = "Bearer $pat"
    Accept        = "application/vnd.github+json"
}

# ── Fetch latest release info ─────────────────────────────────────────────────

Write-Step "Fetching latest release info..."

try {
    $release = Invoke-RestMethod `
        -Uri "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest" `
        -Headers $headers
} catch {
    Write-Fail "Could not fetch release info. Check your PAT has 'repo' scope and the repo name is correct."
}

$version       = $release.tag_name
$zipAsset      = $release.assets | Where-Object { $_.name -like "*-release.zip" }        | Select-Object -First 1
$checksumAsset = $release.assets | Where-Object { $_.name -like "*-release.zip.sha256" } | Select-Object -First 1

if (-not $zipAsset)      { Write-Fail "Could not find release zip in GitHub release $version." }
if (-not $checksumAsset) { Write-Fail "Could not find checksum file in GitHub release $version." }

# ── Confirm with user ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  App:        $APP_NAME $version" -ForegroundColor White
Write-Host "  Install to: $INSTALL_DIR" -ForegroundColor White
Write-Host "  Service:    $SERVICE_NAME (auto-start on boot)" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Proceed with installation? [y/N]"
if ($confirm -notmatch '^[Yy]$') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# ── Download ──────────────────────────────────────────────────────────────────

Write-Step "Downloading $APP_NAME $version..."

$tmp     = Join-Path $env:TEMP "$APP_NAME-install"
$zipPath = Join-Path $tmp "release.zip"

New-Item -ItemType Directory -Force -Path $tmp | Out-Null

# GitHub requires a specific Accept header to download release assets from private repos
$downloadHeaders = @{
    Authorization = "Bearer $pat"
    Accept        = "application/octet-stream"
}

try {
    Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/assets/$($zipAsset.id)" `
        -Headers $downloadHeaders `
        -OutFile $zipPath
    Write-Success "Downloaded release zip"
} catch {
    Write-Fail "Failed to download release zip: $_"
}

# ── Verify checksum ───────────────────────────────────────────────────────────

Write-Step "Verifying checksum..."

try {
    $expectedHash = (Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/assets/$($checksumAsset.id)" `
        -Headers $downloadHeaders).Content.Trim().ToUpper()
} catch {
    Write-Fail "Failed to download checksum: $_"
}

$actualHash = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToUpper()

if ($actualHash -ne $expectedHash) {
    Remove-Item $tmp -Recurse -Force
    Write-Fail "Checksum mismatch!`n  Expected: $expectedHash`n  Got:      $actualHash"
}
Write-Success "Checksum verified"

# ── Extract ───────────────────────────────────────────────────────────────────

Write-Step "Extracting..."

$extractDir = Join-Path $tmp "extracted"
Expand-Archive $zipPath -DestinationPath $extractDir -Force
Write-Success "Extracted"

# ── Stop existing service if upgrading ───────────────────────────────────────

$existingService = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Step "Stopping existing service for upgrade..."
    & "$INSTALL_DIR\nssm.exe" stop $SERVICE_NAME 2>$null
    Start-Sleep -Seconds 2
    Write-Success "Stopped $SERVICE_NAME"
}

# ── Install files ─────────────────────────────────────────────────────────────

Write-Step "Installing files to $INSTALL_DIR..."

New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
Copy-Item "$extractDir\*" $INSTALL_DIR -Recurse -Force
Write-Success "Files installed"

# ── Write CLI shim ────────────────────────────────────────────────────────────

$shimPath = "$INSTALL_DIR\$APP_NAME.cmd"
@"
@echo off
"$INSTALL_DIR\node.exe" "$INSTALL_DIR\cli.cjs" %*
"@ | Set-Content $shimPath -Encoding ASCII
Write-Success "CLI shim written"

# ── Add to system PATH ────────────────────────────────────────────────────────

Write-Step "Adding to system PATH..."

$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($currentPath -notlike "*$INSTALL_DIR*") {
    [System.Environment]::SetEnvironmentVariable(
            "PATH",
            "$currentPath;$INSTALL_DIR",
            "Machine"
    )
    Write-Success "Added $INSTALL_DIR to system PATH"
} else {
    Write-Success "Already in system PATH"
}

Refresh-Path

# ── Register Windows service via NSSM ────────────────────────────────────────

Write-Step "Registering WebSocket service..."

$nssm = "$INSTALL_DIR\nssm.exe"
$node = "$INSTALL_DIR\node.exe"
$ws   = "$INSTALL_DIR\ws.cjs"

if ($existingService) {
    & $nssm remove $SERVICE_NAME confirm 2>$null
    Start-Sleep -Seconds 1
}

& $nssm install $SERVICE_NAME $node $ws
& $nssm set     $SERVICE_NAME DisplayName "$APP_NAME WebSocket Server"
& $nssm set     $SERVICE_NAME Description "WebSocket server for $APP_NAME"
& $nssm set     $SERVICE_NAME Start SERVICE_AUTO_START
& $nssm set     $SERVICE_NAME AppStdout "$INSTALL_DIR\ws.log"
& $nssm set     $SERVICE_NAME AppStderr "$INSTALL_DIR\ws-error.log"
& $nssm start   $SERVICE_NAME

Write-Success "Service '$SERVICE_NAME' installed and started"

# ── Cleanup ───────────────────────────────────────────────────────────────────

Remove-Item $tmp -Recurse -Force

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  $APP_NAME $version installed successfully!" -ForegroundColor Green
Write-Host "  Open a new terminal and run: $APP_NAME --help" -ForegroundColor White
Write-Host ""