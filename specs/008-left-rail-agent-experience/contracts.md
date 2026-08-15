# Contracts 008: Left Rail Contracts

## 1. Timeline Interface (`src/types.ts`)

```typescript
export interface AgentTimelineItem {
  agent_id: string;
  label?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'invalidated' | 'blocked';
  message?: string;
  timestamp?: string;
  started_at?: string;
  completed_at?: string;
  generation: number;
}
```
