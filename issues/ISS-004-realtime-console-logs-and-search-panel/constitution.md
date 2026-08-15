# Issue Constitution: ISS-004 — Real-Time Console Logs Inspector & Live Search Panel

## 1. Fundamental Invariants

### 1.1 Logging Inspector Rules
1. **Docked 3-Pane Placement**: The Console Logs Inspector MUST dock in the 3rd right-hand column (`RightLogsPanel.tsx`) without obscuring the central stage canvas or agent workflow cards.
2. **Dual Stream Segregation**: Logs must provide separate tabbed or toggled streams for `Frontend Logs` (client actions, React state, network requests) and `Backend Logs` (FastAPI, agent thinking, Playwright runner).
3. **Real-Time Highlight & Search**: Search query inputs must visually highlight matching tokens in real-time using yellow/amber `<mark>` styling without altering original line whitespace.
4. **Auto-Scroll Discipline**: When scrolled to the bottom, the panel must auto-scroll on new log entries. If the user manually scrolls up to inspect previous logs, auto-scroll MUST temporarily pause until the user scrolls back to the bottom or clicks "Resume Auto-Scroll".
5. **No Fallback Jargon**: Error messages must show clean, actionable descriptions without confusing internal fallback jargon (e.g. avoid displaying "Failed trying key index 3, rotating to fallback").

## 2. Accessibility & Performance
- Limit DOM rendered lines to maximum 1,000 active nodes (virtualized or capped window) to prevent memory degradation during heavy Playwright execution runs.
