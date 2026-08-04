[CmdletBinding(SupportsShouldProcess)]
param()

$ErrorActionPreference = "Stop"
$PackageRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$InstallRoot = "C:\Users\Chris Nugent\Documents\CONNECTA"
$ManifestPath = Join-Path $PackageRoot "connecta-installed-files.json"
$StageRoot = Join-Path ([IO.Path]::GetTempPath()) ("CONNECTA-stage-" + [guid]::NewGuid().ToString("N"))
$RollbackRoot = Join-Path ([IO.Path]::GetTempPath()) ("CONNECTA-rollback-" + [guid]::NewGuid().ToString("N"))
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "CONNECTA.lnk"

function Assert-Payload {
    param([string]$Root,[object]$Manifest)
    foreach ($Item in $Manifest.files) {
        $Path = Join-Path $Root $Item.path
        if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Payload is missing $($Item.path)." }
        if ($Item.sha256) {
            $Actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
            if ($Actual -ne $Item.sha256) { throw "Payload hash mismatch: $($Item.path)." }
        }
    }
}

function Copy-Payload {
    param([string]$From,[string]$To,[object]$Manifest)
    foreach ($Item in $Manifest.files) {
        $Source = Join-Path $From $Item.path
        $Destination = Join-Path $To $Item.path
        $Parent = Split-Path -Parent $Destination
        New-Item -ItemType Directory -Force -Path $Parent | Out-Null
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

try {
    if ($PackageRoot -ne $InstallRoot) { throw "This cumulative installer only supports the canonical CONNECTA folder: $InstallRoot" }
    if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) { throw "The installed-file manifest is missing." }
    $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    if ($Manifest.version -ne "0.4.3") { throw "Expected v0.4.3 payload; found v$($Manifest.version)." }

    Write-Host "Validating CONNECTA v$($Manifest.version) payload..." -ForegroundColor Cyan
    Assert-Payload -Root $PackageRoot -Manifest $Manifest
    New-Item -ItemType Directory -Force -Path $StageRoot,$RollbackRoot | Out-Null
    Copy-Payload -From $PackageRoot -To $StageRoot -Manifest $Manifest
    Assert-Payload -Root $StageRoot -Manifest $Manifest

    # Only files declared in the verified manifest are changed. Unknown user files remain untouched.
    Copy-Payload -From $InstallRoot -To $RollbackRoot -Manifest $Manifest
    try {
        Copy-Payload -From $StageRoot -To $InstallRoot -Manifest $Manifest
        Assert-Payload -Root $InstallRoot -Manifest $Manifest
    }
    catch {
        Copy-Payload -From $RollbackRoot -To $InstallRoot -Manifest $Manifest
        throw "Installation failed and CONNECTA files were rolled back. $($_.Exception.Message)"
    }

    $Launcher = Join-Path $InstallRoot "Start-CONNECTA.ps1"
    $Icon = Join-Path $InstallRoot "icons\CONNECTA.ico"
    $Shell = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut($DesktopShortcut)
    $Shortcut.TargetPath = (Get-Process -Id $PID).Path
    $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`""
    $Shortcut.WorkingDirectory = $InstallRoot
    $Shortcut.IconLocation = "$Icon,0"
    $Shortcut.Description = "Open CONNECTA Recovery Safety Net"
    $Shortcut.Save()

    & pwsh -NoProfile -File (Join-Path $InstallRoot "Test-CONNECTA-v0.4.3.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Installed-file verification failed." }
    Write-Host "CONNECTA v$($Manifest.version) installed and verified. Browser data and unknown user files were preserved." -ForegroundColor Green
}
finally {
    foreach ($Path in @($StageRoot,$RollbackRoot)) {
        if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
    }
}
