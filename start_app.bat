@echo off
setlocal

echo ===================================================
echo Starting QET Agent Accelerator (Frontend + Backend)
echo ===================================================

echo [1/2] Starting FastAPI Backend on Port 8080...
start "QET Backend (Port 8080)" cmd /c ".\restart_fastapi_app.bat"

echo [2/2] Starting Vite Frontend Dev Server...
start "QET Frontend Dev Server" cmd /c "npm run dev"

echo ===================================================
echo Startup complete! Both servers are running in separate windows.
echo - Frontend Dev Server: http://localhost:5173
echo - FastAPI Backend: http://127.0.0.1:8080
echo ===================================================

endlocal
