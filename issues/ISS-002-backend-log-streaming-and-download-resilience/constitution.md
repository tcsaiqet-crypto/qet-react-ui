# Issue Constitution: ISS-002 — Backend Log Streaming & Download Resilience

## 1. Fundamental Invariants

### 1.1 Log Lifecycle Governance
1. **Never 404 on Log Request**: Any request to `GET /api/v1/runs/{run_id}/logs/backend` or `GET /api/v1/runs/{run_id}/logs/stream` must NEVER return HTTP 404, even if the run was just created and no disk log file exists yet. The backend must synthesize a structured initial log banner on demand.
2. **Context-Scoped Isolation**: Every execution run must write its logs exclusively to `temp/run_{run_id}.log`. Global logging handlers must not leak log entries across concurrent run sessions.
3. **Download Header Completeness**: Downloaded log text files must include standard MIME headers `Content-Disposition: attachment; filename="run_{run_id}_backend.log"` and `Content-Type: text/plain; charset=utf-8`.
4. **Log Format Consistency**: Every emitted log line must adhere to the standard schema `[YYYY-MM-DD HH:MM:SS] [LEVEL] [LOGGER_NAME] MESSAGE`.

## 2. Error Boundaries
- Disk I/O lock on log file: Gracefully fall back to reading in-memory log buffer without raising a 500 error.
- Corrupted log lines: Skip unparseable byte sequences and stream valid lines without terminating the client connection.
