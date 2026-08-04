[CmdletBinding()]
param(
    [string]$Project = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$Failures = [System.Collections.Generic.List[string]]::new()

function Assert-Contains {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Pattern,
        [Parameter(Mandatory)][string]$Description
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        $Failures.Add("Missing file: $Path")
        return
    }

    if ([System.IO.File]::ReadAllText($Path) -notmatch $Pattern) {
        $Failures.Add($Description)
    }
}

function Assert-NotContains {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Pattern,
        [Parameter(Mandatory)][string]$Description
    )

    if ((Test-Path -LiteralPath $Path) -and [System.IO.File]::ReadAllText($Path) -match $Pattern) {
        $Failures.Add($Description)
    }
}

$Index = Join-Path $Project "index.html"
$Domain = Join-Path $Project "recovery-bridge-domain.js"
$Ui = Join-Path $Project "recovery-bridge-ui.js"
$Worker = Join-Path $Project "service-worker.js"
$VersionFile = Join-Path $Project "app-version.json"

Assert-Contains -Path $Index -Pattern 'id="openBridgePlan"' -Description "My First 72 Hours entry point is missing."
Assert-Contains -Path $Index -Pattern 'data-bridge-checkin="red"' -Description "Recovery Bridge safety check-ins are missing."
Assert-Contains -Path $Index -Pattern 'id="recoveryPassportDialog"' -Description "Recovery Passport interface is missing."
Assert-NotContains -Path $Index -Pattern 'data-passport-section="privateNotes"' -Description "Private notes must never be a Recovery Passport option."
Assert-Contains -Path $Domain -Pattern 'buildRecoveryPassport' -Description "Recovery Passport privacy rules are missing."
Assert-Contains -Path $Ui -Pattern 'createRecoveryBridgeUI' -Description "Recovery Bridge interface controller is missing."
Assert-Contains -Path $Worker -Pattern 'recovery-bridge-domain\.js' -Description "Recovery Bridge domain is missing from the offline cache."
Assert-Contains -Path $Worker -Pattern 'recovery-bridge-ui\.js' -Description "Recovery Bridge interface is missing from the offline cache."

try {
    $Version = Get-Content -LiteralPath $VersionFile -Raw | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($Version.version) -or $Version.version -notmatch '^\d+\.\d+\.\d+$') {
        $Failures.Add("app-version.json does not contain a semantic version.")
    }
}
catch {
    $Failures.Add("app-version.json is invalid: $($_.Exception.Message)")
}

$Node = Get-Command node -ErrorAction SilentlyContinue
if ($Node) {
    & $Node.Source --check $Domain
    if ($LASTEXITCODE -ne 0) { $Failures.Add("recovery-bridge-domain.js failed JavaScript syntax validation.") }

    & $Node.Source --check $Ui
    if ($LASTEXITCODE -ne 0) { $Failures.Add("recovery-bridge-ui.js failed JavaScript syntax validation.") }

    $DomainTest = Join-Path $Project "tests\recovery-bridge-domain.test.js"
    if (Test-Path -LiteralPath $DomainTest) {
        & $Node.Source --test $DomainTest
        if ($LASTEXITCODE -ne 0) { $Failures.Add("Recovery Bridge domain tests failed.") }
    }
}
else {
    Write-Host "Node.js was not found; JavaScript execution tests were skipped." -ForegroundColor Yellow
}

if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "CONNECTA Recovery Bridge validation failed:" -ForegroundColor Red
    $Failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host ""
Write-Host "CONNECTA Recovery Bridge validation passed." -ForegroundColor Green
Write-Host "Version: $($Version.version)" -ForegroundColor Cyan
