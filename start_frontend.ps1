# Conf Lister — Start Frontend
# -----------------------------------------------------------

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Write-Host ""

Set-Location (Join-Path $PSScriptRoot "frontend")

# Install deps if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

npm start
