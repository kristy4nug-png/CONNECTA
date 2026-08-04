$ErrorActionPreference = "Stop"

$InstallFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $InstallFolder "connecta-installed-files.json"

if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
    throw "The CONNECTA installed-file manifest is missing."
}

$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$Failures = New-Object System.Collections.Generic.List[string]

foreach ($File in $Manifest.files) {
    $Target = Join-Path $InstallFolder $File.path
    if (-not (Test-Path -LiteralPath $Target -PathType Leaf)) {
        $Failures.Add("Missing: $($File.path)")
        continue
    }
    if (-not [string]::IsNullOrWhiteSpace($File.sha256)) {
        $Actual = (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
        if ($Actual -ne $File.sha256) { $Failures.Add("Hash mismatch: $($File.path)") }
    }
}

foreach ($RequiredText in @("CONNECTA", "My Safety Plan", "Recovery Capital Map", "Personal Appointments", "Worker Handover", "Privacy Lock")) {
    if ((Get-Content -LiteralPath (Join-Path $InstallFolder "index.html") -Raw) -notmatch [Regex]::Escape($RequiredText)) {
        $Failures.Add("index.html is missing: $RequiredText")
    }
}

if ($Failures.Count -gt 0) {
    Write-Host "CONNECTA validation failed:" -ForegroundColor Red
    $Failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    throw "CONNECTA validation found $($Failures.Count) problem(s)."
}

Write-Host "CONNECTA $($Manifest.version) validation passed." -ForegroundColor Green
Write-Host "All installed files are present and match the installer manifest." -ForegroundColor Green
