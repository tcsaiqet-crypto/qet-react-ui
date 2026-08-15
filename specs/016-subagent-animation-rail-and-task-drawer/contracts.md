# Contracts: Subagent Rail & Task Drawer Types

```typescript
export interface SubagentTask {
  task_id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  progress_percentage: number;
  duration_ms?: number;
  details?: string;
}

export interface SubagentMetadata {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  tasks: SubagentTask[];
}

export interface AgentStageMetadata {
  id: string;
  label: string;
  status: 'not_started' | 'running' | 'completed' | 'failed' | 'stopped';
  subagents: SubagentMetadata[];
  primary_action_label: string;
  is_collapsed: boolean;
}
```
