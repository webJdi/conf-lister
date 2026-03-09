# Quick Lister — Run Scripts
# -----------------------------------------------------------
# Start the FastAPI backend
# -----------------------------------------------------------

Write-Host "Starting Backend..." -ForegroundColor Cyan
Write-Host "  API docs: http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host ""

# Change into backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Locate and activate venv — check backend/venv first, then repo-root venv
$venvCandidates = @(
    (Join-Path $backendPath "venv\Scripts\Activate.ps1"),
    (Join-Path $PSScriptRoot "venv\Scripts\Activate.ps1")
)
$activated = $false
foreach ($venvPath in $venvCandidates) {
    if (Test-Path $venvPath) {
        & $venvPath
        Write-Host "  Virtual environment activated: $venvPath" -ForegroundColor Green
        $activated = $true
        break
    }
}

# Run FastAPI with uvicorn (module path relative to backend/)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
