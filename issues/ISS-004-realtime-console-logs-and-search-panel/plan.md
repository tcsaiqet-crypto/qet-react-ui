# Architecture & Implementation Plan: ISS-004

## 1. 3-Pane UI Architecture

```
┌──────────────┬──────────────────────────────────────────┬────────────────────────┐
│ Left Rail    │ Central Stage Canvas                     │ Right Logs Panel       │
│ (Navigation) │ (Stage 1..5 Viewport)                    │ (Real-Time Inspector)  │
│              │                                          │                        │
│ • Stage 1    │  [ Understanding Cards / Test Cases /    │  [ Frontend | Backend ]│
│ • Stage 2    │    Playwright Live Runner / Evidence ]   │  [ Search: "error"   ]│
│ • Stage 3    │                                          │  [ ALL | INFO | ERR  ] │
│ • Stage 4    │                                          │  ┌──────────────────┐  │
│ • Stage 5    │                                          │  │ 14:02:11 [INFO]  │  │
│              │                                          │  │ 14:02:15 [WARN]  │  │
│              │                                          │  └──────────────────┘  │
│              │                                          │  [ ↓ Download Logs ]   │
└──────────────┴──────────────────────────────────────────┴────────────────────────┘
```

## 2. Text Search & Highlight Component Logic
```typescript
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-400 text-black font-semibold rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
```

## 3. Auto-Scroll State Machine
- `isAtBottom` tracked via `onScroll` event (`scrollHeight - scrollTop <= clientHeight + 20`).
- Auto-scroll effect triggered whenever `logs.length` updates, provided `isAtBottom === true`.
