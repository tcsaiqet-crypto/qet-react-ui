# Data Contracts: ISS-004 — Console Logs Component Interfaces

## 1. TypeScript Component Props & State

```typescript
export interface RightLogsPanelProps {
  runId?: string;
  isOpen: boolean;
  onToggle: () => void;
  frontendLogs: LogMessage[];
  backendLogs: LogMessage[];
  onClearLogs?: () => void;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'frontend' | 'backend' | 'agent' | 'playwright';
  message: string;
  meta?: Record<string, unknown>;
}

export type LogLevelFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR';
export type LogStreamTab = 'frontend' | 'backend';
```

## 2. Telemetry Event Contract
```typescript
export interface ClientLogEvent {
  run_id: string;
  level: string;
  timestamp: string;
  component: string;
  action: string;
  details?: unknown;
}
```
