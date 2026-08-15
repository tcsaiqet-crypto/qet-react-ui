# Architecture & Implementation Plan: ISS-008

## 1. UI Modal & Execution Architecture

```
[ Stage 3/4: Test Cases List ]
       │
       ├─ [ [✓] TC-001 | Login Flow ] ──► [ View Script ] ──► [ PlaywrightScriptModal ]
       │                                                      ├─ Copy to Clipboard
       │                                                      └─ Download .spec.ts
       │
       ├─ [ [✓] TC-002 | Checkout ]  ──► [ View Test Data] ──► [ TestDataModal ]
       │                                                      ├─ JSON schema view
       │                                                      └─ CSV table view
       │
       └─ [ [ ] TC-003 | Profile Update ]
              │
              ▼
   [ "Execute 2 Selected Tests" ] ──► POST /api/v1/runs/{run_id}/execution { "test_ids": ["TC-001", "TC-002"] }
```

## 2. Dynamic Execution Trigger
```typescript
async function handleExecuteSelected(selectedIds: string[]) {
  setIsRunning(true);
  const response = await apiClient.post(`/api/v1/runs/${runId}/execution`, {
    test_case_ids: selectedIds,
    headless: false,
  });
  // Poll live execution progress...
}
```
