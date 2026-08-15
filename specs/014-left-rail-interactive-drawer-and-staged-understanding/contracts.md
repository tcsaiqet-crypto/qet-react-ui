# Data Contracts & Schemas (Spec-Kit 014)

## 1. Drawer & Left-Rail State Interfaces

```typescript
export type RailViewMode = 'understanding_focus' | 'full_pipeline';

export type DrawerTabId = 'overview' | 'subagents' | 'artifacts' | 'actions';

export interface SelectedAgentContext {
  agent_id: string;
  label: string;
  phase: string;
  step_number: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'invalidated' | 'blocked';
  description: string;
  subagents: Array<{
    subagent_id: string;
    label: string;
    status: string;
    message?: string;
    elapsed_seconds?: number;
  }>;
  inputs_summary: {
    files?: Array<{ name: string; size_bytes: number; extension: string }>;
    parameters?: Record<string, any>;
    prompt_tokens?: number;
  };
  artifacts_summary: {
    total_artifacts: number;
    manifest_available: boolean;
    data_payload?: Record<string, any>;
    checklist_evaluation?: Array<{
      check_id: string;
      title: string;
      status: 'pass' | 'fail' | 'partial';
      score: number;
      findings: string;
    }>;
  };
  execution_logs: string[];
  retryable: boolean;
  can_clear_cache: boolean;
}

export interface DrawerState {
  isOpen: boolean;
  activeTab: DrawerTabId;
  selectedAgentId: string | null;
  isDocked: boolean;
  width: number; // default 420px
}
```

---

## 2. Staged Hero Sequence State

```typescript
export type StagedHeroStep =
  | 'requirement_understanding'
  | 'document_intake'
  | 'application_understanding';

export interface StagedHeroProgress {
  currentHero: StagedHeroStep;
  docsUploadedCount: number;
  codebaseIndexedCount: number;
  isUnderstandingComplete: boolean;
  canProceedToDownstream: boolean;
}
```
