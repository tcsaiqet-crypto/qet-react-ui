# Architecture & Implementation Plan: ISS-003

## 1. UI Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Navigation Header: Brand Logo | Model Selector (Gemini 3.7) | Status │
├────────────────────────────────────────────────────────────────────────┤
│ Main Intake Container (Centered, above-the-fold)                       │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────┐      │
│  │   Lane 1: Requirements    │      │    Lane 2: Target Code    │      │
│  │     (PDF, MD, DOCX)       │      │        (ZIP, Code)        │      │
│  │                           │      │                           │      │
│  │  [ Drag & Drop Zone 1 ]   │      │  [ Drag & Drop Zone 2 ]   │      │
│  │  + Staged Files List      │      │  + Staged ZIP Artifact    │      │
│  └───────────────────────────┘      └───────────────────────────┘      │
│                                                                        │
│   [ Sample Presets: E-Commerce Demo | Insurance Demo | Banking Demo ]  │
│                                                                        │
│             [ ★ Start Autonomous Testing Pipeline ★ ]                  │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Component State Design
```typescript
interface UploadState {
  docFiles: File[];
  codeFiles: File[];
  isDraggingDoc: boolean;
  isDraggingCode: boolean;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
}
```

## 3. Visual Styling Tokens
- Container: Tailwind `max-w-6xl mx-auto px-4 py-6`
- Lanes: Grid `grid grid-cols-1 md:grid-cols-2 gap-6`
- Dropzones: `border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl bg-slate-900/50 p-6 text-center transition-colors`
