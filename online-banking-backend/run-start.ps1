# PowerShell script to run the FastAPI production server
# Get the script directory to ensure we're in the right folder
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "Working directory: $scriptPath" -ForegroundColor Cyan

# Check if virtual environment exists
if (Test-Path "$scriptPath\env\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "$scriptPath\env\Scripts\Activate.ps1"
    Write-Host "Starting uvicorn server..." -ForegroundColor Yellow
    uvicorn main:app --host 0.0.0.0 --port 8000
} elseif (Test-Path "$scriptPath\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "$scriptPath\venv\Scripts\Activate.ps1"
    Write-Host "Starting uvicorn server..." -ForegroundColor Yellow
    uvicorn main:app --host 0.0.0.0 --port 8000
} else {
    Write-Host "Virtual environment not found. Please create one first:" -ForegroundColor Red
    Write-Host "  python -m venv env" -ForegroundColor Yellow
    Write-Host "  .\env\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

