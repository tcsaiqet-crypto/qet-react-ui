# Spec-Kit 024: QET Agent Pipeline Architectural Redesign

## Overview
Complete architectural redesign of the QET platform into a 6-agent hierarchical pipeline with 7 major feature areas, each documented independently as a sub-folder containing comprehensive requirement and specification files.

---

## Feature Sub-Folders

| Sub-Folder | Feature | Sub-Files |
| :--- | :--- | :--- |
| [`feature-01-application-understanding-agent/`](./feature-01-application-understanding-agent/) | Application Understanding Agent (Parent + 3 Sub-Agents) | 4 requirement files |
| [`feature-02-test-case-generation-agent/`](./feature-02-test-case-generation-agent/) | Test Case Generation Agent | 3 requirement files |
| [`feature-03-data-generation-agent/`](./feature-03-data-generation-agent/) | Data Generation Agent (AI Mode + Upload Mode) | 3 requirement files |
| [`feature-04-test-script-agent/`](./feature-04-test-script-agent/) | Test Script Agent | 3 requirement files |
| [`feature-05-execute-agent/`](./feature-05-execute-agent/) | Execute Agent | 3 requirement files |
| [`feature-06-dashboard-agent/`](./feature-06-dashboard-agent/) | Dashboard Agent (Allure + Screenshots + JSON) | 4 requirement files |
| [`feature-07-ui-navigation-redesign/`](./feature-07-ui-navigation-redesign/) | UI Navigation & Pipeline Flow Redesign | 3 requirement files |

---

## Architecture Diagram

```
Left Rail Pipeline (no top-nav tabs)
│
├─ 1. Application Understanding Agent ▼
│     ├─ 1a. Requirement Intake Sub-Agent
│     ├─ 1b. Codebase Intake Sub-Agent
│     └─ 1c. Requirement Understanding Sub-Agent
│
├─ 2. Test Case Generation Agent
├─ 3. Data Generation Agent
├─ 4. Test Script Agent
├─ 5. Execute Agent
└─ 6. Dashboard Agent
```

## Key Design Principles
1. **No sample/placeholder data anywhere**
2. **No separate "Execution" tab** — all navigation is left-rail driven
3. **Each sub-agent completes before exposing the next**
4. **AI-only data generation unless user explicitly uploads their own**
5. **Per test case**: dedicated script, dedicated data record, dedicated screenshots (pass + fail), runtime JSON
