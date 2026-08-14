# Data Contracts 011

## App State Extensions
Add deterministic lifecycle fields to the run state model.

### Required Structures
1. agent_timeline
2. subagent_timeline
3. active_agent
4. upcoming_agent
5. reset_generation
6. upload_summary_left
7. upload_summary_right

### Suggested Shape
```json
{
  "agent_timeline": [
    {
      "agent_id": "requirement_understanding",
      "label": "Requirement Understanding Agent",
      "status": "pending|running|completed|failed|invalidated",
      "started_at": "ISO8601",
      "completed_at": "ISO8601",
      "generation": 1
    }
  ],
  "subagent_timeline": [
    {
      "parent_agent_id": "application_understanding",
      "subagent_id": "component_inventory",
      "label": "Component Inventory",
      "status": "pending|running|completed|failed|invalidated",
      "message": "Scanning source files",
      "started_at": "ISO8601",
      "completed_at": "ISO8601",
      "generation": 1
    }
  ],
  "active_agent": "document_intake",
  "upcoming_agent": "application_understanding",
  "reset_generation": 1
}
```

## Lifecycle Event Contract
Use structured events for deterministic UI rendering and recovery after refresh.

### Required Event Types
1. agent_entered
2. agent_completed
3. agent_failed
4. subagent_started
5. subagent_completed
6. subagent_failed
7. agent_retry_requested
8. downstream_invalidated

### Event Shape
```json
{
  "event_id": "uuid",
  "event_type": "agent_completed",
  "run_id": "RUN-...",
  "agent_id": "document_intake",
  "subagent_id": null,
  "generation": 2,
  "message": "Document intake complete",
  "timestamp": "ISO8601",
  "source": "backend.pipeline"
}
```

## Retry And Reset Contract
1. Retrying agent N increments generation.
2. All timeline items for agents N+1 and their subagents are marked invalidated.
3. Dependent payloads from invalidated stages are removed from active rendering structures.
4. UI must render generation-consistent data only.

## Upload Summary Contract
Each upload lane supports compact and expanded views.

### Required Fields
1. total_files
2. included_count
3. excluded_count
4. reviewed_count
5. files[] with decision metadata
6. filters supported: all, included, excluded, reviewed

### File Row Shape
```json
{
  "path": "src/components/HomeUploadPage.tsx",
  "decision": "included|excluded|reviewed",
  "reason": "Relevant source file",
  "source": "heuristic|ai|manual"
}
```
