# ISS-009 · Understanding → Pipeline UX Flow Improvements

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: Understanding Page → Header Banner → Flow Buttons

---

## Problem Statement

The understanding page header currently has two action buttons:
1. `Start AI Understanding` / `Re-Run AI Analysis`
2. `Run Test Generation Agents` (only visible after understanding completes)

Issues:
1. The second button in the header is now duplicated by the bottom CTA we added (ISS-004 done)
2. The header banner is too dense when both buttons are visible
3. Users don't understand the linear flow: **Intake → Understanding → Generation → Execution**
4. No progress indicator showing which step they're on

---

## Functional Requirements

### FR-009-A: Remove Duplicate "Run Test Generation" from Header
- Keep only the bottom CTA (ISS-004 done)
- Header banner shows only `Start AI Understanding` / `Re-Run AI Analysis`
- Reduces cognitive load

### FR-009-B: Linear Step Progress Indicator
Add a horizontal step strip at the top of the Understanding section:

```
[1. Upload] → [2. AI Understanding ●] → [3. Test Generation] → [4. Execute]
```

- Active step: filled circle
- Completed step: checkmark + line
- Upcoming step: hollow circle + dimmed text

### FR-009-C: "What Happens Next" Info Box
After Understanding completes, show a subtle info card:

```
✅ AI Understanding Complete
→ Next: Run Test Generation Agent to generate 15–25 test cases
```

### FR-009-D: Re-Run Warning Dialog
When user clicks `Re-Run AI Analysis`:
- Show a confirmation: "Re-running will overwrite current understanding and require re-running test generation. Continue?"
- Two buttons: `Cancel` / `Yes, Re-run`

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/UnderstandingPage.tsx` | Remove duplicate button from header, add step indicator, re-run dialog |
| `src/components/HomeUploadPage.tsx` | Connect step progress strip styling |
