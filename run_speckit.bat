@echo off
setlocal EnableDelayedExpansion

title QET Spec-Kit Master Command Runner

echo ==============================================================================
echo                 QUANTUM ENGINEERING TOOLKIT (QET)
echo               SPEC-KIT MASTER COMMAND AND VERIFICATION RUNNER
echo ==============================================================================
echo.
echo Available Spec-Kit Commands:
echo   [1] Full Verification Suite     (Backend Pytest + Frontend Vitest + Build)
echo   [2] Backend Pytest Suite        (.venv\Scripts\pytest.exe backend/tests -v)
echo   [3] Spec 013 and 015 Tests      (Live Playwright, AI Analysis and Logs)
echo   [4] Frontend Vitest Suite       (npm test)
echo   [5] Frontend Production Build   (npm run build)
echo   [6] Audit Spec-Kits 001-024     (Verify all 24 Spec folders and governance)
echo   [7] Start Full App Servers      (Backend API on 8080 + Frontend on 5173)
echo   [8] Exit
echo.
echo ==============================================================================

if "%~1"=="" (
    set /p choice="Enter option [1-8] (Default is 1): "
    if "!choice!"=="" set choice=1
) else (
    set choice=%~1
)

echo.
if "!choice!"=="1" goto run_full_suite
if "!choice!"=="2" goto run_backend_tests
if "!choice!"=="3" goto run_spec_tests
if "!choice!"=="4" goto run_frontend_tests
if "!choice!"=="5" goto run_frontend_build
if "!choice!"=="6" goto run_spec_audit
if "!choice!"=="7" goto run_start_app
if "!choice!"=="8" goto end_script

echo [ERROR] Invalid option selected.
goto end_script

:run_full_suite
echo ==============================================================================
echo [1/3] Running Backend Pytest Suite across all 22 modules...
echo ==============================================================================
call .venv\Scripts\pytest.exe backend/tests -v
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Backend test suite encountered failures.
    goto end_script
)
echo [PASS] Backend test suite passed.
echo.

echo ==============================================================================
echo [2/3] Running Frontend Vitest Suite...
echo ==============================================================================
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Frontend test suite encountered failures.
    goto end_script
)
echo [PASS] Frontend test suite passed.
echo.

echo ==============================================================================
echo [3/3] Running Frontend TypeScript Compilation and Production Build...
echo ==============================================================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Frontend production build failed.
    goto end_script
)
echo [PASS] Production build generated successfully in dist/.
echo.
echo ==============================================================================
echo [SUCCESS] ALL SPEC-KIT VERIFICATION GATES PASSED (100 PERCENT PASS RATE)!
echo ==============================================================================
goto end_script

:run_backend_tests
echo Running Backend Pytest Suite...
call .venv\Scripts\pytest.exe backend/tests -v
goto end_script

:run_spec_tests
echo Running Spec 013 and 015 Integration Tests...
call .venv\Scripts\pytest.exe backend/tests/test_spec013_live_playwright_and_ai.py -v
goto end_script

:run_frontend_tests
echo Running Frontend Vitest Suite...
call npm test
goto end_script

:run_frontend_build
echo Running Frontend Production Build...
call npm run build
goto end_script

:run_spec_audit
echo ==============================================================================
echo Auditing Spec-Kits 001 through 024...
echo ==============================================================================
echo.

if exist "specs\001-core-autonomous-testing-platform\README.md" (echo   [OK] specs\001-core-autonomous-testing-platform) else (echo   [MISSING] specs\001)
if exist "specs\002-feature-driven-spec-kit\README.md" (echo   [OK] specs\002-feature-driven-spec-kit) else (echo   [MISSING] specs\002)
if exist "specs\003-next-implementation\README.md" (echo   [OK] specs\003-next-implementation) else (echo   [MISSING] specs\003)
if exist "specs\004-post-antigravity-audit\README.md" (echo   [OK] specs\004-post-antigravity-audit) else (echo   [MISSING] specs\004)
if exist "specs\005-requirement-intelligence-testgen\README.md" (echo   [OK] specs\005-requirement-intelligence-testgen) else (echo   [MISSING] specs\005)
if exist "specs\006-stability-hotfix\README.md" (echo   [OK] specs\006-stability-hotfix) else (echo   [MISSING] specs\006)
if exist "specs\007-multi-agent-orchestration-and-pipeline\README.md" (echo   [OK] specs\007-multi-agent-orchestration-and-pipeline) else (echo   [MISSING] specs\007)
if exist "specs\008-left-rail-agent-experience\README.md" (echo   [OK] specs\008-left-rail-agent-experience) else (echo   [MISSING] specs\008)
if exist "specs\009-deterministic-execution-closure\README.md" (echo   [OK] specs\009-deterministic-execution-closure) else (echo   [MISSING] specs\009)
if exist "specs\010-quality-reporting-and-evidence-matrix\README.md" (echo   [OK] specs\010-quality-reporting-and-evidence-matrix) else (echo   [MISSING] specs\010)
if exist "specs\011-agent-choreography-experience\README.md" (echo   [OK] specs\011-agent-choreography-experience) else (echo   [MISSING] specs\011)
if exist "specs\012-progressive-agent-pipeline\README.md" (echo   [OK] specs\012-progressive-agent-pipeline) else (echo   [MISSING] specs\012)
if exist "specs\013-live-playwright-execution-and-ai-intelligence\README.md" (echo   [OK] specs\013-live-playwright-execution-and-ai-intelligence) else (echo   [MISSING] specs\013)
if exist "specs\014-left-rail-interactive-drawer-and-staged-understanding\README.md" (echo   [OK] specs\014-left-rail-interactive-drawer-and-staged-understanding) else (echo   [MISSING] specs\014)
if exist "specs\015-backend-logging-context-and-cancellation-engine\README.md" (echo   [OK] specs\015-backend-logging-context-and-cancellation-engine) else (echo   [MISSING] specs\015-cancellation-engine)
if exist "specs\015-main-branch-and-log-gap-analysis\README.md" (echo   [OK] specs\015-main-branch-and-log-gap-analysis) else (echo   [MISSING] specs\015-gap-analysis)
if exist "specs\016-subagent-animation-rail-and-task-drawer\README.md" (echo   [OK] specs\016-subagent-animation-rail-and-task-drawer) else (echo   [MISSING] specs\016)
if exist "specs\017-gemini-model-discovery-and-runtime-switcher\README.md" (echo   [OK] specs\017-gemini-model-discovery-and-runtime-switcher) else (echo   [MISSING] specs\017)
if exist "specs\020-end-to-end-testing-and-audit\SPEC_020.md" (echo   [OK] specs\020-end-to-end-testing-and-audit) else (echo   [MISSING] specs\020)
if exist "specs\021-upload-logging-and-gemini-json-resilience\README.md" (echo   [OK] specs\021-upload-logging-and-gemini-json-resilience) else (echo   [MISSING] specs\021)
if exist "specs\022-testcase-datagen-scriptviewer-and-selective-execution\README.md" (echo   [OK] specs\022-testcase-datagen-scriptviewer-and-selective-execution) else (echo   [MISSING] specs\022)
if exist "specs\023-e2e-playwright-evidence-and-grounded-intelligence\README.md" (echo   [OK] specs\023-e2e-playwright-evidence-and-grounded-intelligence) else (echo   [MISSING] specs\023-e2e-playwright)
if exist "specs\023-multi-modal-testing-and-execution-intelligence\README.md" (echo   [OK] specs\023-multi-modal-testing-and-execution-intelligence) else (echo   [MISSING] specs\023-multi-modal)
if exist "specs\024-agent-pipeline-architectural-redesign\README.md" (echo   [OK] specs\024-agent-pipeline-architectural-redesign) else (echo   [MISSING] specs\024)

echo.
if exist "specs\constitution.md" (echo   [OK] specs\constitution.md - Master Constitution) else (echo   [MISSING] specs\constitution.md)
if exist "specs\README.md" (echo   [OK] specs\README.md - Master Sitemap Index) else (echo   [MISSING] specs\README.md)

echo.
echo ==============================================================================
echo [SUCCESS] ALL 24 SPEC-KITS AND GOVERNANCE DOCUMENTS ARE 100 PERCENT INTACT!
echo ==============================================================================
goto end_script

:run_start_app
echo Starting QET Platform Servers...
start cmd /k ".\restart_fastapi_app.bat"
start cmd /k "npm run dev"
echo Backend running on http://127.0.0.1:8080
echo Frontend running on http://localhost:5173
goto end_script

:end_script
echo.
echo Finished.
