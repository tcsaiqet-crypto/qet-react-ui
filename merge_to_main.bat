@echo off
setlocal enabledelayedexpansion

set REPO_DIR=%~dp0
cd /d "%REPO_DIR%"

for /f "delims=" %%b in ('git branch --show-current') do set CURRENT_BRANCH=%%b
if "%CURRENT_BRANCH%"=="main" (
  echo Already on main.
) else (
  git fetch origin
  git checkout main
  git merge "%CURRENT_BRANCH%"
  git push origin main
)

endlocal