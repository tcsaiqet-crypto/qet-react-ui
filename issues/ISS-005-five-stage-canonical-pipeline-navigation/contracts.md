# Data Contracts: ISS-005 — 5-Stage Pipeline Stage Interfaces

## 1. Stage State Contract

```typescript
export type CanonicalStageId = 
  | 'INTAKE'
  | 'REQUIREMENT_UNDERSTANDING'
  | 'TEST_GENERATION'
  | 'EXECUTION'
  | 'QUALITY_REPORT';

export type StageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'LOCKED';

export interface CanonicalStage {
  id: CanonicalStageId;
  index: number;
  title: string;
  subtitle: string;
  icon: string;
  status: StageStatus;
  metricsSummary?: string;
  errorMessage?: string;
}

export interface AgentPipelineRailProps {
  stages: CanonicalStage[];
  activeStageId: CanonicalStageId;
  onSelectStage: (stageId: CanonicalStageId) => void;
  canAdvance: boolean;
  onAdvanceStage: () => void;
}
```
