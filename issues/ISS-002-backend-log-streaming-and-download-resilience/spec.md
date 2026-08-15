# Specification: ISS-002 — Backend Log Streaming & Download Resilience

## 1. Problem Statement
When users clicked "Download Backend Logs" immediately after initiating a run, the frontend encountered an unhandled 404 response because `temp/run_{run_id}.log` had not yet been flushed to disk. Furthermore, real-time log polling lacked empty-state header initializers.

## 2. User Stories
- **US-1**: As a developer inspecting a test run, I want to download backend logs at any point in the run lifecycle without encountering 404 errors.
- **US-2**: As the UI Right Logs panel, I want to poll or stream logs continuously from backend initialization through final execution.
- **US-3**: As an automated test harness, I want log files to be cleanly isolated per run ID so test assertions are deterministic.

## 3. Functional Requirements
1. **Dynamic Log Initialization**:
   - When `GET /api/v1/runs/{run_id}/logs/backend` is called and the file does not exist, generate:
     ```
     [YYYY-MM-DD HH:MM:SS] [INFO] [System] === Initialized Run Log for {run_id} ===
     [YYYY-MM-DD HH:MM:SS] [INFO] [System] No active log entries recorded yet.
     ```
   - Return HTTP 200 with `text/plain` content.
2. **Streaming Endpoint**:
   - `GET /api/v1/runs/{run_id}/logs/stream`: SSE (Server-Sent Events) or polled chunk stream returning new log lines since `offset`.
3. **Log Directory Management**:
   - Automatically ensure the `temp/` directory exists before writing any log file.

## 4. Acceptance Criteria
- [x] Requesting logs for a freshly generated UUID returns HTTP 200 with valid header metadata.
- [x] Log downloads trigger native browser file save as `.txt` or `.log`.
- [x] Concurrent runs do not interleave log lines into the same file.
