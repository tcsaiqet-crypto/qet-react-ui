# 006 Full Text & Markdown UI Wireframe Visualizations

**Date**: 2026-08-15  
**Theme**: Light Enterprise (Slate `#F8FAFC`, White `#FFFFFF`, Navy `#163B65`, Blue `#2563EB`)  
**Scope**: Complete Screen Layout, Animated Left Rail, Center Workspace, Right Logs Panel, Header Model Selector  

---

## 1. Complete Application Screen (Light Enterprise Mode)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ QET Agent Accelerator  │  Active Run: [ 📋 RUN-20260815-001 ]  │  Model: [ ✦ Gemini 3.7 Flash (Medium) ▾ ]  │  [ ⏹ Stop Run ]  │  [ ☀️ Light ]  [ 🔍 100% ] │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ Home ]    [ Execution ]    [ Quality Report ]    [ Run History ]    [ AI Tools & Keys ]                                                                       │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┤
│  LEFT ANIMATED AGENT RAIL      │  CENTER MAIN WORKSPACE                                          │  RIGHT-SIDE CONSOLE LOGS & INSPECTOR                          │
│                                │                                                                 │                                                               │
│  ┌──────────────────────────┐  │  ┌───────────────────────────────────────────────────────────┐  │  ┌─────────────────────────────────────────────────────────┐  │
│  │ ✓ 1. Intake Agent    [▲] │  │  │  Active Stage: ⚡ Requirement Understanding Agent         │  │  │  [ Frontend Logs (42) ]      [ Backend Logs (128) ]    │  │
│  │   Status: Completed      │  │  │  Step 2 / 5  │  Progress: [██████████░░░░░░░░░░] 45%      │  │  ├─────────────────────────────────────────────────────────┤  │
│  │   Files: 6 docs, 1 zip   │  │  └───────────────────────────────────────────────────────────┘  │  │  [ (All) ]   [ Info ]   [ Status ]   [ (●) Error (2) ]     │  │
│  └──────────────────────────┘  │                                                                 │  │  ┌───────────────────────────────────────────────────┐ │  │
│                                │  ┌───────────────────────────────────────────────────────────┐  │  │  │ 🔍 Search logs: [ "login"                     ] [x]│ │  │
│  ┌──────────────────────────┐  │  │ 📊 REQUIREMENT INTELLIGENCE SUMMARY                       │  │  │  └───────────────────────────────────────────────────┘ │  │
│  │ ◉ 2. Requirement Agent ──│  │  │ ┌───────────────────────┬───────────────────────────────┐ │  │  │                                                         │  │
│  │ ┌──────────────────────┐ │  │  │ │ Functional:        24 │ Business Rules:            12 │ │  │  │ [16:21:40] [INFO] [fastapi] Starting stage analysis...   │  │
│  │ │ 📄 Doc Parser    [✓] │ │  │  │ │ Positive Cases:    18 │ Security / Validation:      8 │ │  │  │ [16:21:42] [INFO] [gemini-3.7-flash] Thinking budget:4096│  │
│  │ │ 🧠 Context AST   [✓] │ │  │  │ │ Negative Scenarios: 6 │ Compliance:                 4 │ │  │  │ [16:21:43] [STATUS] Extracted 3 forms from auth.py       │  │
│  │ │ 🏷️ Categorizer   [▶] │ │  │  │ └───────────────────────┴───────────────────────────────┘ │  │  │ [16:21:44] [INFO] Generated test case:                     │  │
│  │ └──────────────────────┘ │  │  │                                                           │  │  │   >> [TC-01] Valid ==login== with email & password     │  │
│  │                          │  │  │ 📑 Discovered Endpoints:                                  │  │  │   >> [TC-02] Invalid ==login== with locked account      │  │
│  │  ┌────────────────────┐  │  │  │   • POST /api/v1/auth/login [Public]                      │  │  │ [16:21:45] [STATUS] Saved 24 test cases to memory       │  │
│  │  │  ▶ Run Stage       │  │  │  │   • GET  /api/v1/user/profile [Bearer Token Required]     │  │  │ [16:21:46] [WARN] Optional parameter missing in auth doc│  │
│  │  └────────────────────┘  │  │  │   • POST /api/v1/checkout/submit [CSRF Protected]         │  │  │ [16:21:47] [INFO] Synthesizing Playwright test scripts..│  │
│  │                          │  │  └───────────────────────────────────────────────────────────┘  │  │                                                         │  │
│  └──────────────────────────┘  │                                                                 │  │  [☑ Auto-Scroll]         [⬇ Clear]  [💾 Download Logs] │  │
│                                │                                                                 │  └─────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐  │                                                                 │                                                               │
│  │ ⏳ 3. Test Generation     │  │                                                                 │                                                               │
│  │   (Pending Stage)        │  │                                                                 │                                                               │
│  └──────────────────────────┘  │                                                                 │                                                               │
│                                │                                                                 │                                                               │
│  ┌──────────────────────────┐  │                                                                 │                                                               │
│  │ ⏳ 4. Playwright Execute  │  │                                                                 │                                                               │
│  │   (Pending Stage)        │  │                                                                 │                                                               │
│  └──────────────────────────┘  │                                                                 │                                                               │
│                                │                                                                 │                                                               │
│  ┌──────────────────────────┐  │                                                                 │                                                               │
│  │ ⏳ 5. Quality Report      │  │                                                                 │                                                               │
│  │   (Pending Stage)        │  │                                                                 │                                                               │
│  └──────────────────────────┘  │                                                                 │                                                               │
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 2. Component Detail Wireframes

### A. Top Navigation Header & Model Switcher

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ QET Agent Accelerator   │   Project: CFA Digital Journey   │   Run ID: [ 📋 RUN-20260815-001 (Copied!) ]    │
│                                                                                                                  │
│  Provider: (•) Gemini  ( ) GPT   │  Model: [ ✦ Gemini 3.7 Flash (Medium) ▾ ]       │  [ ⏹ Stop Run ]  │  [ ☀️ ] │
│                                            ├─ ✦ Gemini 3.7 Flash (Low)    [1024 budget • 1.9s]                   │
│                                            ├─ ✦ Gemini 3.7 Flash (Medium) [4096 budget • 2.9s] ★                 │
│                                            ├─ ✦ Gemini 3.7 Flash (High)   [8192 budget • 4.7s]                   │
│                                            └─ ✦ OpenAI GPT-4o-mini        [Fallback Tier]                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### B. Left-Side Animated Rail: Stage Lifecycle Progression

```text
1. COMPLETED STAGE (Collapsed into 48px summary)
┌─────────────────────────────────────────────────┐
│  ✓ 1. Intake Agent                        [▲]   │
│     Status: Completed (100%)                    │
└─────────────────────────────────────────────────┘

2. ACTIVE RUNNING STAGE (Glowing Blue Border, Expanded Subagents, Exactly 1 Button)
┌─────────────────────────────────────────────────┐
│  ◉ 2. Requirement Understanding Agent     [▼]   │
│  ─────────────────────────────────────────────  │
│  Subagents:                                     │
│    ✓ 📄 Doc Parser       [100% • 6 docs parsed] │
│    ✓ 🧠 Context AST      [100% • 4 modules]     │
│    ▶ 🏷️ Categorizer      [ 60% • Classifying..] │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  ▶ Run Stage Analysis                     │  │  <-- EXACTLY ONE PRIMARY ACTION BUTTON
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

3. PENDING STAGE (Muted Outline, Ready to execute next)
┌─────────────────────────────────────────────────┐
│  ⏳ 3. Test Generation Agent                     │
│     Status: Waiting for Requirement Stage       │
└─────────────────────────────────────────────────┘
```

---

### C. Right-Side Live Console Logs Drawer

```text
┌───────────────────────────────────────────────────────────────────────┐
│  LIVE EXECUTION CONSOLE & DIAGNOSTICS                            [ _ ]│
├───────────────────────────────────┬───────────────────────────────────┤
│  [  Frontend Events (42)  ]       │  [★ Backend Uvicorn/Pytest (128)] │
├───────────────────────────────────┴───────────────────────────────────┤
│  Filter:  [ All ]  [ Info (85) ]  [ Status (32) ]  [ Error (2) ]      │
│                                                                       │
│  Search: [ 🔍 "login"                                           ] [x] │
│                                                                       │
│  Log Output Stream:                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ [16:21:40] [INFO] [qet_accelerator] Initiating pipeline run...  │  │
│  │ [16:21:41] [INFO] [llm_service] Using Key #1 (AIzaSyD5...9_24)   │  │
│  │ [16:21:42] [INFO] [gemini-3.7-flash] Thinking budget: 4096      │  │
│  │ [16:21:43] [STATUS] Extracted form inputs for /auth/login       │  │
│  │ [16:21:44] [INFO] Synthesizing test cases for auth module...    │  │
│  │ [16:21:45] [INFO] >> TC-01: Valid ==login== with credentials    │  │
│  │ [16:21:46] [INFO] >> TC-02: Invalid ==login== with bad password │  │
│  │ [16:21:47] [STATUS] Test Case generation complete (24 cases)   │  │
│  │ [16:21:48] [INFO] Saved artifacts to uploads/RUN-20260815-001/  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Controls:                                                            │
│  [☑ Auto-Scroll to Match]      [ 🗑️ Clear ]      [ 💾 Export .txt ]    │
└───────────────────────────────────────────────────────────────────────┘
```
