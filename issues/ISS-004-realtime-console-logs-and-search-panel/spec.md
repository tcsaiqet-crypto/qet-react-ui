# Specification: ISS-004 — Real-Time Console Logs Inspector & Live Search Panel

## 1. Problem Statement
Previously, an overlapping `AgentDetailDrawer` obscured the right portion of the workspace during agent execution. Furthermore, engineers debugging pipeline failures had no live search, filtering, or log downloading capabilities directly within the active UI view.

## 2. User Stories
- **US-1**: As an engineer, I want a dedicated right-side console logs inspector docked alongside the workflow canvas so I can watch backend and frontend events in real time.
- **US-2**: As a QA tester, I want to filter logs by severity pills (`ALL`, `INFO`, `WARN`, `ERROR`) and search keywords with instant `<mark>` highlighting to quickly isolate issues.
- **US-3**: As a developer, I want to collapse the logs drawer or download the entire session log with one click.

## 3. Functional Requirements
1. **Collapsible 3rd-Pane Layout**:
   - Expanded state: Width `w-80` to `w-96`, containing header, filter pills, search input, scrollable log viewport, and download action bar.
   - Collapsed state: Compact vertical rail icon button showing active log pulse dot.
2. **Filter & Search Engine**:
   - Text input performs live regex / string search over log messages.
   - Filter pills filter log entries by `level` in < 16ms.
3. **Download Controls**:
   - "Download Logs" button calls `GET /api/v1/runs/{run_id}/logs/backend` and initiates direct file download.

## 4. Acceptance Criteria
- [x] Right logs panel docks cleanly in 3-pane layout without covering central canvas content.
- [x] Typing in search input highlights matching text segments with `<mark class="bg-amber-400 text-black">`.
- [x] Toggling between `Frontend` and `Backend` tabs updates the active log view instantaneously.
