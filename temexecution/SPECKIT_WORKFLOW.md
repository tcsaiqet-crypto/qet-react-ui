# Spec-Kit Workflow

This repository uses document-first Spec-Kits. There is no required external Spec-Kit CLI in the current project, so the commands below create and validate the same artifact structure with PowerShell and project test commands.

## Create A New Agent Spec-Kit

Replace `AGENT_ID`, `AGENT_NAME`, and `NUMBER` before running:

```powershell
$root = "specs/NUMBER-AGENT_ID"
New-Item -ItemType Directory -Force $root | Out-Null
@("README.md", "constitution.md", "spec.md", "plan.md", "tasks.md", "acceptance-tests.md", "risks.md", "launcher.md", "prompt.md", "antigravity-master-prompt.md") | ForEach-Object { New-Item -ItemType File -Force "$root/$_" | Out-Null }
```

Populate the files in this order:

1. `README.md`: goal, scope, artifacts, definition of done.
2. `constitution.md`: non-negotiable architecture and quality rules.
3. `spec.md`: user stories, inputs, outputs, and failure behavior.
4. `data-contracts.md`: add state and API shapes when needed.
5. `plan.md`: phases with exit gates.
6. `tasks.md`: atomic implementation tasks.
7. `acceptance-tests.md`: behavior scenarios and pass criteria.
8. `risks.md`: risks, impact, mitigation, residual uncertainty.
9. `launcher.md`: startup, verification, and failure handling.
10. `prompt.md`: short execution prompt.
11. `antigravity-master-prompt.md`: complete autonomous execution prompt.

## Execute A Spec-Kit

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
Get-Content temexecution/agents/01-understanding-agent/spec-kit.md
npm run build
npm run test
Set-Location backend
python -m pytest -q
```

For a single backend feature:

```powershell
python -m pytest tests/test_fastapi_app.py -q
```

## Close A Spec-Kit

Record:

- Files changed grouped by phase and gap.
- Commands and exact results.
- Acceptance test outcomes.
- Unresolved blockers with reason and workaround.
- Residual risks and follow-up work.

Do not mark a phase complete because code exists. Mark it complete only after its exit gate passes.
