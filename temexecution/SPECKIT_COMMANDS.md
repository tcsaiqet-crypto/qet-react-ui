# Spec-Kit Commands

## Create All Agent Spec Folders

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
$specs = @(
  "012-intake-orchestration",
  "013-understanding-agent-runtime",
  "014-requirement-categorizer",
  "015-test-case-agent",
  "016-test-data-agent",
  "017-playwright-agent",
  "018-report-agent"
)
$files = @("README.md", "constitution.md", "spec.md", "data-contracts.md", "plan.md", "tasks.md", "acceptance-tests.md", "risks.md", "launcher.md", "prompt.md", "antigravity-master-prompt.md")
foreach ($spec in $specs) {
  $path = "specs/$spec"
  New-Item -ItemType Directory -Force $path | Out-Null
  foreach ($file in $files) { New-Item -ItemType File -Force "$path/$file" | Out-Null }
}
```

## Copy The Briefs Into A New Spec

```powershell
Copy-Item temexecution/agents/01-understanding-agent/spec-kit.md specs/013-understanding-agent-runtime/spec.md
Copy-Item temexecution/agents/01-understanding-agent/execution-steps.md specs/013-understanding-agent-runtime/tasks.md
```

Then expand the remaining required documents using the phase plan and contracts.

## Run One Spec-Kit

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
npm run build
npm run test
Set-Location backend
python -m pytest -q
```

## Run All Agent Spec-Kits In Order

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
npm run build
npm run test
Set-Location backend
$testGroups = @(
  "tests/test_upload.py",
  "tests/test_fastapi_app.py",
  "tests/test_understanding.py",
  "tests/test_schemas.py",
  "tests/test_test_case_agent.py",
  "tests/test_synthetic_data_agent.py",
  "tests/test_playwright_agent.py",
  "tests/test_report_agent.py",
  "tests/test_pipeline.py"
)
foreach ($group in $testGroups) { python -m pytest $group -q }
python -m pytest -q
```

## Run The Full Runtime

Terminal 1:

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
uvicorn src.api.fastapi_app:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
npm run dev
```

## Closeout Command Set

```powershell
npm run build
npm run test
Set-Location backend
python -m pytest -q
Set-Location ..
git status --short
```
