param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 8765
)

$ErrorActionPreference = "Stop"
$Root = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$Address = [Net.IPAddress]::Parse("127.0.0.1")

function Get-ContentType {
    param([string]$Path)

    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html"        { return "text/html; charset=utf-8" }
        ".htm"         { return "text/html; charset=utf-8" }
        ".css"         { return "text/css; charset=utf-8" }
        ".js"          { return "application/javascript; charset=utf-8" }
        ".json"        { return "application/json; charset=utf-8" }
        ".webmanifest" { return "application/manifest+json; charset=utf-8" }
        ".svg"         { return "image/svg+xml" }
        ".png"         { return "image/png" }
        ".jpg"         { return "image/jpeg" }
        ".jpeg"        { return "image/jpeg" }
        ".webp"        { return "image/webp" }
        ".ico"         { return "image/x-icon" }
        ".txt"         { return "text/plain; charset=utf-8" }
        ".md"          { return "text/markdown; charset=utf-8" }
        default        { return "application/octet-stream" }
    }
}

function Send-Response {
    param(
        [Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body
    )

    $HeaderLines = @(
        "HTTP/1.1 $StatusCode $StatusText"
        "Content-Type: $ContentType"
        "Content-Length: $($Body.Length)"
        "Cache-Control: no-store, no-cache, must-revalidate"
        "Pragma: no-cache"
        "Expires: 0"
        "X-Content-Type-Options: nosniff"
        "Connection: close"
        ""
        ""
    )

    $HeaderBytes = [Text.Encoding]::ASCII.GetBytes(($HeaderLines -join "`r`n"))
    $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)

    if ($Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }

    $Stream.Flush()
}

function Test-ConnectaServer {
    param([int]$TestPort)

    try {
        $Response = Invoke-WebRequest `
            -Uri "http://127.0.0.1:$TestPort/?connecta=probe" `
            -UseBasicParsing `
            -TimeoutSec 2

        return (
            $Response.StatusCode -eq 200 -and
            $Response.Content -match "<title>CONNECTA"
        )
    }
    catch {
        return $false
    }
}

if (Test-ConnectaServer -TestPort $Port) {
    Start-Process "http://127.0.0.1:$Port/?connecta=live"
    return
}

$Listener = $null

for ($CandidatePort = $Port; $CandidatePort -le ($Port + 10); $CandidatePort++) {
    try {
        $Listener = [Net.Sockets.TcpListener]::new($Address, $CandidatePort)
        $Listener.Start()
        $Port = $CandidatePort
        break
    }
    catch {
        if ($null -ne $Listener) {
            $Listener.Stop()
            $Listener = $null
        }
    }
}

if ($null -eq $Listener) {
    throw "CONNECTA could not find a free local port between $Port and $($Port + 10)."
}

$Url = "http://127.0.0.1:$Port/?connecta=live"

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host " CONNECTA IS RUNNING" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host $Url -ForegroundColor Cyan
Write-Host "Keep this window open while using CONNECTA." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop it." -ForegroundColor Yellow
Write-Host ""

Start-Process $Url

try {
    while ($true) {
        $Client = $Listener.AcceptTcpClient()
        $Reader = $null
        $Stream = $null

        try {
            $Stream = $Client.GetStream()
            $Reader = New-Object IO.StreamReader(
                $Stream,
                [Text.Encoding]::ASCII,
                $false,
                8192,
                $true
            )

            $RequestLine = $Reader.ReadLine()

            while ($true) {
                $HeaderLine = $Reader.ReadLine()

                if ([string]::IsNullOrEmpty($HeaderLine)) {
                    break
                }
            }

            if ([string]::IsNullOrWhiteSpace($RequestLine)) {
                continue
            }

            $Parts = $RequestLine.Split(" ")

            if ($Parts.Count -lt 2 -or $Parts[0] -ne "GET") {
                $Body = [Text.Encoding]::UTF8.GetBytes("Method not allowed")
                Send-Response `
                    -Stream $Stream `
                    -StatusCode 405 `
                    -StatusText "Method Not Allowed" `
                    -ContentType "text/plain; charset=utf-8" `
                    -Body $Body

                continue
            }

            $UrlPath = $Parts[1].Split("?")[0]
            $Relative = [Uri]::UnescapeDataString($UrlPath.TrimStart("/"))

            if ([string]::IsNullOrWhiteSpace($Relative)) {
                $Relative = "index.html"
            }

            $Candidate = [IO.Path]::GetFullPath((Join-Path $Root $Relative))

            if (-not $Candidate.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) {
                $Body = [Text.Encoding]::UTF8.GetBytes("Forbidden")
                Send-Response `
                    -Stream $Stream `
                    -StatusCode 403 `
                    -StatusText "Forbidden" `
                    -ContentType "text/plain; charset=utf-8" `
                    -Body $Body

                continue
            }

            if (Test-Path -LiteralPath $Candidate -PathType Container) {
                $Candidate = Join-Path $Candidate "index.html"
            }

            if (-not (Test-Path -LiteralPath $Candidate -PathType Leaf)) {
                $Body = [Text.Encoding]::UTF8.GetBytes("Not found")
                Send-Response `
                    -Stream $Stream `
                    -StatusCode 404 `
                    -StatusText "Not Found" `
                    -ContentType "text/plain; charset=utf-8" `
                    -Body $Body

                continue
            }

            $Body = [IO.File]::ReadAllBytes($Candidate)
            $ContentType = Get-ContentType -Path $Candidate

            Send-Response `
                -Stream $Stream `
                -StatusCode 200 `
                -StatusText "OK" `
                -ContentType $ContentType `
                -Body $Body
        }
        catch {
            Write-Warning $_.Exception.Message
        }
        finally {
            if ($null -ne $Reader) {
                $Reader.Dispose()
            }

            if ($null -ne $Stream) {
                $Stream.Dispose()
            }

            $Client.Close()
        }
    }
}
finally {
    if ($null -ne $Listener) {
        $Listener.Stop()
    }
}