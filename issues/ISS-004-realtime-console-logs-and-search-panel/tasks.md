# Task Breakdown & Verification: ISS-004

## 1. Implementation Tasks
- [x] **T-4.1**: Create and dock `src/components/RightLogsPanel.tsx` in the 3-column application shell (`App.tsx`).
- [x] **T-4.2**: Implement real-time text search filter with `<mark>` visual token highlighting.
- [x] **T-4.3**: Add severity filter pills (`ALL`, `INFO`, `WARN`, `ERROR`) with badge counts.
- [x] **T-4.4**: Implement scroll detection hook to intelligently pause/resume auto-scrolling on user wheel interaction.
- [x] **T-4.5**: Add "Download Logs" button tied directly to backend log streaming endpoint.

## 2. Verification Milestones
- [x] **V-4.1**: Launch UI with 3 columns — verify Right Logs Panel occupies 3rd column without overlapping stage canvas.
- [x] **V-4.2**: Emit 100 sample log entries — verify search bar filters matches in < 16ms.
- [x] **V-4.3**: Verify clicking "Download Logs" downloads valid `.log` file formatted with timestamp headers.
