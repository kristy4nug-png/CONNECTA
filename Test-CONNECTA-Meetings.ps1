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

    $Text = [System.IO.File]::ReadAllText($Path)
    if ($Text -notmatch $Pattern) {
        $Failures.Add($Description)
    }
}

$Index = Join-Path $Project "index.html"
$Domain = Join-Path $Project "meeting-domain.js"
$Ui = Join-Path $Project "meeting-ui.js"
$Worker = Join-Path $Project "service-worker.js"
$VersionFile = Join-Path $Project "app-version.json"

Assert-Contains -Path $Index -Pattern 'data-meeting-tab="find"' -Description "Find a Meeting tab is missing."
Assert-Contains -Path $Index -Pattern 'data-meeting-tab="mine"' -Description "My Meetings tab is missing."
Assert-Contains -Path $Index -Pattern 'data-meeting-tab="reminders"' -Description "Reminders tab is missing."
Assert-Contains -Path $Index -Pattern 'data-meeting-tab="archived"' -Description "Archived tab is missing."
Assert-Contains -Path $Index -Pattern 'id="clearMeetingData"' -Description "Meeting-only privacy deletion is missing."
Assert-Contains -Path $Domain -Pattern 'migrateLegacyMeetings' -Description "Legacy meeting migration is missing."
Assert-Contains -Path $Ui -Pattern 'createMeetingUI' -Description "Meeting interface controller is missing."
Assert-Contains -Path $Worker -Pattern 'meeting-domain\.js' -Description "Meeting domain is missing from the offline cache."
Assert-Contains -Path $Worker -Pattern 'meeting-ui\.js' -Description "Meeting interface is missing from the offline cache."

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
    if ($LASTEXITCODE -ne 0) { $Failures.Add("meeting-domain.js failed JavaScript syntax validation.") }

    & $Node.Source --check $Ui
    if ($LASTEXITCODE -ne 0) { $Failures.Add("meeting-ui.js failed JavaScript syntax validation.") }

    $DomainTest = Join-Path $Project "tests\meeting-domain.test.js"
    if (Test-Path -LiteralPath $DomainTest) {
        & $Node.Source --test $DomainTest
        if ($LASTEXITCODE -ne 0) { $Failures.Add("Meeting domain tests failed.") }
    }
}
else {
    Write-Host "Node.js was not found; JavaScript execution tests were skipped." -ForegroundColor Yellow
}

if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "CONNECTA meeting validation failed:" -ForegroundColor Red
    $Failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host ""
Write-Host "CONNECTA meeting upgrade validation passed." -ForegroundColor Green
Write-Host "Version: $($Version.version)" -ForegroundColor Cyan
