@echo off
setlocal enabledelayedexpansion

echo ================================================================================
echo                    QET AGENT ACCELERATOR - QUICK RERUN
echo ================================================================================

echo.
echo [1/3] Stopping previous instances on ports 8080 and 5173...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
  taskkill /F /PID %%P >nul 2>nul
)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  taskkill /F /PID %%P >nul 2>nul
)

echo [2/3] Restarting FastAPI Backend (Port 8080)...
start "QET Backend (Port 8080)" cmd /c "cd /d "%~dp0backend" && set PYTHONPATH=. && set QET_ENABLE_REQUIREMENT_CATEGORIZATION=true && python -m uvicorn src.api.fastapi_app:app --host 127.0.0.1 --port 8080 --reload"

timeout /t 2 /nobreak >nul

echo [3/3] Restarting Vite Frontend Dev Server (Port 5173)...
start "QET Frontend Dev Server" cmd /c "cd /d "%~dp0" && npm run dev"

echo.
echo ================================================================================
echo   Rerun initiated!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8080
echo ================================================================================
echo.

endlocal
