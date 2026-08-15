# Contracts 003: Bridge & API Contracts

## 1. Runtime Interfaces (`src/types.ts`)

```typescript
export interface StatusResponse {
  run_id: string;
  state: AppState['status'];
  progress: number;
  error?: ErrorPayload;
  intake_manifest?: IntakeManifest;
}
```
