# Feature 01: Application Understanding Agent — Parent Orchestrator & 3 Sub-Agents

## 1. Overview

The Application Understanding Agent is the **first stage** in the QET pipeline. It acts as a parent orchestrator that coordinates three sequential sub-agents:

1. **Requirement Intake Sub-Agent** — ingests uploaded requirement documents
2. **Codebase Intake Sub-Agent** — ingests and extracts uploaded codebase ZIP archive
3. **Requirement Understanding Sub-Agent** — performs AI-driven analysis

The parent agent's workspace is always visible in the left rail as the first entry. When expanded, it reveals the three sub-agents beneath it. All three sub-agents must complete before the "Proceed to Test Case Generation" CTA becomes available.

---

## 2. User Stories

- **US-1**: As a QA engineer, I want to see the Application Understanding Agent as the first item in the left rail with a chevron I can click to expand and see the three sub-agents beneath it.
- **US-2**: As a QA engineer, I want to see the overall Application Understanding Agent status as "In Progress" until all three sub-agents are completed.
- **US-3**: As a QA lead, I want to see the progress of each sub-agent independently (Pending → Running → Completed / Failed).
- **US-4**: As a QA engineer, I want a clear "Proceed to Test Case Generation" button that only becomes active after all three sub-agents have successfully completed.
- **US-5**: As a user, I want to be able to retry any individual sub-agent that fails without restarting the other sub-agents.

---

## 3. Left Rail Visual Hierarchy

```
┌────────────────────────────────────────────────────────┐
│  ▼ Application Understanding Agent        [In Progress] │
│    ├── ✅ 1a. Requirement Intake                         │
│    ├── ✅ 1b. Codebase Intake                            │
│    └── ⏳ 1c. Requirement Understanding                  │
│                                                        │
│  ○ Test Case Generation Agent             [Pending]    │
│  ○ Data Generation Agent                  [Pending]    │
│  ○ Test Script Agent                      [Pending]    │
│  ○ Execute Agent                          [Pending]    │
│  ○ Dashboard Agent                        [Pending]    │
└────────────────────────────────────────────────────────┘
```

---

## 4. Functional Requirements

### FR-1: Parent Agent Orchestration
- Parent agent status = `Pending` until sub-agent 1a starts.
- Parent agent status = `In Progress` while any sub-agent is running.
- Parent agent status = `Completed` only when ALL three sub-agents reach `Completed`.
- Parent agent status = `Failed` if any sub-agent reaches `Failed` and has not been retried.

### FR-2: Sub-Agent Sequencing
- Sub-agents execute in strict sequence: 1a → 1b → 1c.
- Sub-agent 1b (Codebase Intake) is blocked until 1a (Requirement Intake) completes.
- Sub-agent 1c (Understanding) is blocked until both 1a and 1b complete.
- If 1a completes and 1b is still pending, the workspace focus automatically moves to 1b.

### FR-3: Retry Granularity
- Each sub-agent has its own `[Retry]` button visible in its workspace panel when status is `Failed`.
- Retrying a sub-agent resets only its own outputs, not the outputs of the other sub-agents.

### FR-4: State Persistence
- All three sub-agent outputs persist across browser refresh.
- If the user leaves and returns, each sub-agent displays its last status and output.

---

## 5. Data Contracts

### AppState additions
```typescript
interface ApplicationUnderstandingParentState {
  req_intake_status: 'pending' | 'running' | 'completed' | 'failed';
  codebase_intake_status: 'pending' | 'running' | 'completed' | 'failed';
  understanding_status: 'pending' | 'running' | 'completed' | 'failed';
  parent_status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
```

---

## 6. Acceptance Criteria
- [ ] Application Understanding Agent appears as first left-rail entry with expand chevron.
- [ ] Expanding shows 3 sub-agents with individual status badges.
- [ ] Parent status reflects combined child state.
- [ ] Retry on one sub-agent does not affect others.
- [ ] "Proceed to Test Case Generation" CTA is disabled until all 3 sub-agents complete.
