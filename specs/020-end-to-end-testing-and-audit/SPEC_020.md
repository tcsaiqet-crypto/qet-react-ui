# Spec-Kit 020: End-to-End Testing, UI Alignment & Issues Audit Log

**Author**: QET Core Agent Architecture  
**Status**: APPROVED & ACTIVE  
**Created**: 2026-08-15  
**Corpus**: `tcsaiqet-crypto/qet-react-ui`

---

## 1. Executive Summary & Wireframe Alignment

This specification documents the complete **3-Pane Enterprise UI Architecture**, **5-Agent Progressive Pipeline**, **Gemini 3.7 Flash Model Control**, **Live Right-Side Console Logs Inspector**, and the **End-to-End Test & Issues Audit**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ QET Agent Accelerator  │  Active Run: [ 📋 RUN-20260815-001 ]  │  Model: [ ✦ Gemini 3.7 Flash (Medium) ▾ ]  │  [ ⏹ Stop Run ]  │  [ ☀️ Light ] │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ Home ]    [ Execution ]    [ Quality Report ]    [ Run History ]    [ AI Tools & Keys ]                                                       │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────┤
│  LEFT ANIMATED AGENT RAIL      │  CENTER MAIN WORKSPACE                                          │  RIGHT-SIDE CONSOLE LOGS & INSPECTOR          │
│                                │                                                                 │                                               │
│  ┌──────────────────────────┐  │  ┌───────────────────────────────────────────────────────────┐  │  ┌─────────────────────────────────────────┐  │
│  │ ✓ 1. Intake Agent    [▲] │  │  │  Active Stage: ⚡ Requirement Understanding Agent         │  │  │  [ Frontend Logs (42) ] [ Backend (128)]│  │
│  │   Status: Completed      │  │  │  Step 2 / 5  │  Progress: [██████████░░░░░░░░░░] 45%      │  │  ├─────────────────────────────────────────┤  │
│  │   Files: 6 docs, 1 zip   │  │  └───────────────────────────────────────────────────────────┘  │  │  [ (All) ]  [ Info ]  [ (●) Error (2) ]  │  │
│  └──────────────────────────┘  │                                                                 │  │  ┌───────────────────────────────────┐  │  │
│                                │  ┌───────────────────────────────────────────────────────────┐  │  │  │ 🔍 Search logs: [ "login"       ] │  │  │
│  ┌──────────────────────────┐  │  │ 📊 REQUIREMENT INTELLIGENCE SUMMARY                       │  │  │  └───────────────────────────────────┘  │  │
│  │ ◉ 2. Requirement Agent ──│  │  │ ┌───────────────────────┬───────────────────────────────┐ │  │  │                                         │  │
│  │ ┌──────────────────────┐ │  │  │ │ Functional:        24 │ Business Rules:            12 │ │  │  │ [16:21:40] [INFO] Pipeline started...   │  │
│  │ │ 📄 Doc Parser    [✓] │ │  │  │ │ Positive Cases:    18 │ Security / Validation:      8 │ │  │  │ [16:21:42] [INFO] Gemini thinking: 4096 │  │
│  │ │ 🧠 Context AST   [✓] │ │  │  │ │ Negative Scenarios: 6 │ Compliance:                 4 │ │  │  │ [16:21:43] [STATUS] Extracted 3 forms   │  │
│  │ │ 🏷️ Categorizer   [▶] │ │  │  │ └───────────────────────┴───────────────────────────────┘ │  │  │ [16:21:44] [INFO] Generated test case:    │  │
│  │ └──────────────────────┘ │  │  │                                                           │  │  │   >> [TC-01] Valid ==login== email... │  │
│  │                          │  │  │ 📑 Discovered Endpoints:                                  │  │  │   >> [TC-02] Invalid ==login== lock... │  │
│  │  ┌────────────────────┐  │  │  │   • POST /api/v1/auth/login [Public]                      │  │  │ [16:21:45] [STATUS] 24 test cases ready │  │
│  │  │  ▶ Run Stage       │  │  │  │   • GET  /api/v1/user/profile [Bearer Token Required]     │  │  │ [16:21:47] [INFO] Synthesizing scripts..│  │
│  │  └────────────────────┘  │  │  │   • POST /api/v1/checkout/submit [CSRF Protected]         │  │  │                                         │  │
│  │                          │  │  └───────────────────────────────────────────────────────────┘  │  │  [☑ Auto-Scroll]   [🗑 Clear] [💾 Export]│  │
│  └──────────────────────────┘  │                                                                 │  └─────────────────────────────────────────┘  │
│                                │                                                                 │                                               │
│  ┌──────────────────────────┐  │                                                                 │                                               │
│  │ ⏳ 3. Test Generation     │  │                                                                 │                                               │
│  │   (Pending Stage)        │  │                                                                 │                                               │
│  └──────────────────────────┘  │                                                                 │                                               │
│                                │                                                                 │                                               │
│  ┌──────────────────────────┐  │                                                                 │                                               │
│  │ ⏳ 4. Playwright Execute  │  │                                                                 │                                               │
│  │   (Pending Stage)        │  │                                                                 │                                               │
│  └──────────────────────────┘  │                                                                 │                                               │
│                                │                                                                 │                                               │
│  ┌──────────────────────────┐  │                                                                 │                                               │
│  │ ⏳ 5. Quality Report      │  │                                                                 │                                               │
│  │   (Pending Stage)        │  │                                                                 │                                               │
│  └──────────────────────────┘  │                                                                 │                                               │
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Issues Identified During E2E Testing & Immediate Remediation

| Issue ID | Component | Description & Root Cause | Remediation Applied | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ISS-001** | Backend API | `POST /api/v1/runs/{run_id}/understanding` returned `405 Method Not Allowed` because route was registered only as `/understanding/start`. | Added decorator aliases `@app.post("/api/v1/runs/{run_id}/understanding")` and `/start-understanding`. | **RESOLVED** |
| **ISS-002** | Backend API | `GET /api/v1/runs/{run_id}/logs/backend` threw 404 when requested prior to file generation on disk. | Added fallback log header initialization on empty download so the user always receives a valid `.txt` file. | **RESOLVED** |
| **ISS-003** | UI Layout | Subagent stream cards and duplicate execution headers occupied excessive vertical space above upload lanes. | Refactored `HomeUploadPage.tsx` to immediately present the Dual Upload lanes. | **RESOLVED** |
| **ISS-004** | UI Layout | Misplaced `AgentDetailDrawer` obscured the right viewport instead of the requested real-time Console Logs panel. | Created and docked `RightLogsPanel.tsx` in the 3rd column with Frontend/Backend streams, filter pills, and `<mark>` search highlighting. | **RESOLVED** |
| **ISS-005** | Left Rail | Fragmented 11-step list was cluttered and lacked clear progression. | Consolidated into 5 canonical stages (`Intake`, `Requirement Understanding`, `Test Generation`, `Execution`, `Quality Report`) with auto-scroll and 1-button rule. | **RESOLVED** |
| **ISS-006** | Model Switcher | UI needed instant switching between Gemini 3.7 Flash thinking budgets without restarting the backend. | Added dynamic `GET /api/v1/ai/models` endpoint and header dropdown with Low (1024), Medium (4096), and High (8192) options. | **RESOLVED** |

---

## 3. End-to-End Test Execution Logs

- **Frontend Compilation (`npm run build`)**: 0 errors, 1485 modules transformed in `8.61s`.
- **Backend Test Suite (`pytest`)**: 24/24 passed in `22.18s`.
- **Live Gemini 3.7 Flash Thinking Tiers**:
  - Low (1024 tokens): 1.9s latency
  - Medium (4096 tokens): 2.9s latency
  - High (8192 tokens): 4.7s latency
