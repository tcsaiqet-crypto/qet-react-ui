# ISS-003 · Log Panel Width — Persistence & Panel Sync

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: Right Log Panel (RightLogsPanel.tsx)

---

## Problem Statement

The drag-to-resize log panel resets width to `384px` whenever:
1. User switches tabs (Home → Execution → Runs)
2. User refreshes the browser
3. Component re-mounts

Width should persist in `localStorage` and the **center workspace** must respond instantly without any flash.

---

## Functional Requirements

### FR-003-A: Width Persistence via localStorage
- Key: `qet-log-panel-width`
- Default: `384` (px) if not set
- Write on drag-end (mouseup), not on every pixel change
- Read on mount

### FR-003-B: Center Workspace Flex
- The center `div` in `App.tsx` must be `flex-1 min-w-0` to auto-fill
- No fixed `lg:w-96` on the log panel — already done; verify consistency

### FR-003-C: Log Panel Collapse Persistence  
- Key: `qet-log-panel-open`
- When collapsed (narrow pill), persist that state too
- When expanded, restore last used width

### FR-003-D: Resize Min/Max Guards
- Min: `280px` (already set in drag handler)
- Max: `700px` (already set)
- If viewport < 1024px: always full-width, hide drag handle

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/RightLogsPanel.tsx` | Add `localStorage` read/write on mount and drag-end |
| `src/App.tsx` | Ensure center `div` is `flex-1 min-w-0` (verify) |

---

## Implementation Steps

```typescript
// On mount:
const saved = localStorage.getItem('qet-log-panel-width');
if (saved) setPanelWidth(parseInt(saved, 10));

// On drag end (inside onMouseUp):
localStorage.setItem('qet-log-panel-width', String(newWidth));
```
