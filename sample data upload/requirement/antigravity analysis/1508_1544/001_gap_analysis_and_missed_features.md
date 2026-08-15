# 001 Gap Analysis and Missed Features Audit

**Date**: 2026-08-15  
**Timestamp**: 15:44  
**Target Scope**: UI Parity, Backend Integration, Log UI, Cancellation Engine, Agent Choreography Rail, Gemini Model Switcher  

---

## 1. Executive Summary

During the recent merge of `origin/main` (commit `de88119` - Spec-014 Interactive Rail and Staged Understanding) into commit `4449cec`, several critical features previously implemented in commit `c6a1aa4` were accidentally overwritten or unhooked in `src/App.tsx` and `backend/schemas/contracts.py`.

Additionally, requirements discussed for the **Left-Side Animated Agent Rail**, **Right-Side Task Drawer**, **Model Discovery & Switching**, and **Automatic Subagent Scroll/Collapse** require a formal architectural synthesis and step-by-step restoration plan.

---

## 2. Identified Gaps & Root Cause Analysis

### Gap 1: Backend `contracts.py` Python `NameError` (CRITICAL - FIXED)
* **Symptom**: `NameError: name 'ExecutionResult' is not defined` when starting FastAPI on port 8080.
* **Root Cause**: Missing `from __future__ import annotations` at the top of `backend/schemas/contracts.py`, causing Pydantic type annotations to fail when `ExecutionStatusResponse` references `ExecutionResult` before its declaration.
* **Fix Status**: Applied `from __future__ import annotations` at line 2 of `contracts.py`. Verified clean import.

### Gap 2: Console Log Drawer UI Missing in Main Container
* **Symptom**: Logs section disappears from the UI; users cannot view real-time frontend and backend logs.
* **Root Cause**: `ConsoleLogDrawer` component in `src/components/ConsoleLogDrawer.tsx` was unhooked from `src/App.tsx` during the merge.
* **Restoration Requirement**: Re-render `<ConsoleLogDrawer>` inline within the main workspace flex column in `src/App.tsx`.

### Gap 3: Pipeline Cancellation & Stop Run Button Unhooked
* **Symptom**: "Stop Run" button does not appear or trigger during active process runs.
* **Root Cause**: `handleCancelRun` function and `cancelRun` service call were omitted from `src/App.tsx`, and `onCancelRun` was not passed to `ActiveProcessBar` and `UnderstandingPage`.
* **Restoration Requirement**: Wire `handleCancelRun` to `cancelRun()` in `apiClient.ts` and pass `onCancelRun={handleCancelRun}` to active components.

### Gap 4: Left-Side Animation Rail with Subagents & Right Drawer Tasks
* **Symptom**: Subagents under main agents lack clear visual stage transitions, automated scroll-down collapse, and task list synchronization in the right inspector drawer.
* **Requirement**:
  1. Animated left rail showcasing all main agents and subagent names.
  2. Right side drawer displaying active tasks for selected subagents.
  3. Automatic auto-scroll down to the next active agent upon stage completion, collapsing completed agents into compact cards.
  4. Minimal action buttons: Exactly ONE primary button per agent card (with conditional secondary actions only when required).

### Gap 5: Model Selection & Gemini Model Discovery
* **Symptom**: Lack of model selection controls and dynamic discovery of available Gemini models in the UI toolbar/settings.
* **Requirement**: Dynamic model selector supporting dynamic model listing (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-1.5-pro`, `gpt-4o`, etc.) with fallback API key rotation.

---

## 3. Immediate Action Matrix

| Item | Component | Impact | Status |
|---|---|---|---|
| 001 | `backend/schemas/contracts.py` | Fix FastAPI NameError | **Resolved** |
| 002 | `src/App.tsx` + `ConsoleLogDrawer.tsx` | Restore Inline Console Log Drawer | **Planned** |
| 003 | `src/App.tsx` + `ActiveProcessBar.tsx` | Restore Stop Run / Cancellation UI | **Planned** |
| 004 | `AgentPipelineRail.tsx` + `AgentDetailDrawer.tsx` | Progressive Rail & Right Drawer Tasks | **Planned** |
| 005 | `AISettingsPanel.tsx` | Gemini Model Switcher & Key Discovery | **Planned** |

