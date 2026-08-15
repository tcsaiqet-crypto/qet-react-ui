# Architecture & Implementation Plan: ISS-005

## 1. 5-Stage State Machine Diagram

```
[ Stage 1: Intake ] ──► [ Stage 2: Understanding ] ──► [ Stage 3: Test Gen ]
        │                            │                            │
        ▼                            ▼                            ▼
  Upload Docs & Code           Parse PRD & AST              Generate Test Cases &
                                                             Playwright Scripts
                                                                  │
                                                                  ▼
[ Stage 5: Quality Report ] ◄── [ Stage 4: Live Execution ] ◄─────┘
        ▲                                    ▲
        │                                    │
  Generate PDF & HTML                  Run Headed Playwright
  Executive Matrix                     with Pause/Resume
```

## 2. Left Rail Auto-Scroll Implementation
```typescript
export function useAutoScrollToActive(activeStageId: string) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    }
  }, [activeStageId]);

  return activeRef;
}
```

## 3. Stage Progression Validation Rules
- `canAccessStage(stageIndex)` checks:
  - If `stageIndex === 0`: Always `true`.
  - Else: `stages[stageIndex - 1].status === 'COMPLETED'`.
