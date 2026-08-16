@echo off
setlocal enabledelayedexpansion

echo ================================================================================
echo        QET AGENT ACCELERATOR - START FROM SCRATCH (COLD START)
echo ================================================================================

echo.
echo [Step 1/5] Terminating any existing backend and frontend processes...

:: Kill processes on port 8080 (FastAPI Backend)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
  echo   - Killing process on port 8080 (PID: %%P)...
  taskkill /F /PID %%P >nul 2>nul
)

:: Kill processes on port 8000 (Legacy Port)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
  echo   - Killing process on port 8000 (PID: %%P)...
  taskkill /F /PID %%P >nul 2>nul
)

:: Kill processes on port 5173 (Vite Frontend Dev Server)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  echo   - Killing process on port 5173 (PID: %%P)...
  taskkill /F /PID %%P >nul 2>nul
)

echo   - Existing sessions cleared.
echo.

echo [Step 2/5] Initializing Environment Variables...
cd /d "%~dp0"
set PYTHONPATH=%~dp0backend
set QET_ENABLE_REQUIREMENT_CATEGORIZATION=true
echo   - Workspace Root: %~dp0
echo   - Backend Root:   %~dp0backend
echo.

echo [Step 3/5] Starting FastAPI Backend on http://127.0.0.1:8080 (First)...
start "QET Backend (Port 8080)" cmd /k "cd /d "%~dp0backend" && set PYTHONPATH=. && set QET_ENABLE_REQUIREMENT_CATEGORIZATION=true && python -m uvicorn src.api.fastapi_app:app --host 127.0.0.1 --port 8080 --reload"

echo   - Waiting 3 seconds for FastAPI Backend initialization...
timeout /t 3 /nobreak >nul
echo.

echo [Step 4/5] Starting Vite Frontend Dev Server on http://localhost:5173...
start "QET Frontend Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo   - Waiting 3 seconds for Vite server startup...
timeout /t 3 /nobreak >nul
echo.

echo [Step 5/5] Launching Frontend in Default Browser...
start http://localhost:5173

echo.
echo ================================================================================
echo   SUCCESS! QET Agent Accelerator is running from scratch.
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8080
echo   - Health:   http://127.0.0.1:8080/api/v1/health
echo ================================================================================
echo.

endlocal
