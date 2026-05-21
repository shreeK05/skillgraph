param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $root
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$venvActivate = Join-Path $workspaceRoot '.venv\Scripts\Activate.ps1'

if (-not (Test-Path $venvActivate)) {
    throw "Virtual environment not found at $venvActivate. Create it first or adjust the script."
}

Write-Host 'Starting SkillGraph locally...' -ForegroundColor Cyan
Write-Host 'Backend:  http://127.0.0.1:8001' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Green

$backendCmd = @"
Set-Location '$backendDir'; `
`$env:PYTHONPATH='$backendDir'; `
. '$venvActivate'; `
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
"@

$frontendCmd = @"
Set-Location '$frontendDir'; `
. '$venvActivate'; `
npm run dev
"@

Start-Process powershell -ArgumentList '-NoExit','-Command',$backendCmd | Out-Null
Start-Process powershell -ArgumentList '-NoExit','-Command',$frontendCmd | Out-Null

if (-not $NoBrowser) {
    Start-Process 'http://localhost:3000'
}

Write-Host 'Two PowerShell windows were opened for backend and frontend.' -ForegroundColor Yellow
