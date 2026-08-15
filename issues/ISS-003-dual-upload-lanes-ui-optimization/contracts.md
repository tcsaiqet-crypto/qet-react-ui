# Data Contracts: ISS-003 — UI Intake & Upload Component Interfaces

## 1. Frontend Component Props

```typescript
export interface HomeUploadPageProps {
  onStartAnalysis: (runId: string, docCount: number, codeCount: number) => void;
  selectedModel?: string;
  isBackendConnected: boolean;
}

export interface StagedFileItem {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  type: 'DOCUMENT' | 'CODEBASE';
}

export interface SamplePresetDefinition {
  id: string;
  title: string;
  description: string;
  docPath: string;
  codeZipPath: string;
  badge: string;
}
```

## 2. Event Payload Contracts
```typescript
export interface UploadStartEvent {
  run_id: string;
  timestamp: string;
  document_names: string[];
  codebase_name: string;
}
```
