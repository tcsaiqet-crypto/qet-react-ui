# Plan: Logging Context & Cancellation Engine Architecture

## 1. Context Scoping Flow
1. When `start_understanding` or `start_pipeline` is dispatched in `fastapi_app.py`, the background runner enters `log_run_context(run_id)`.
2. Any downstream invocation of `logger.info()`, `logger.error()`, or `logger.warning()` invokes `RunFileHandler.emit()`.
3. `RunFileHandler` resolves `current_run_id.get()`, opens `temp/run_{run_id}.log` in append mode with UTF-8 encoding, and writes the formatted entry.

## 2. Pipeline Interruption Loop
In `pipeline.py`:
```python
for stage in self.STAGES[self.STAGES.index(start_stage):]:
    from src.services.run_state_service import load_run_state
    latest_state = load_run_state(state.run_id)
    if latest_state and latest_state.status in ("stopped", "cancelled"):
        logger.info(f"Pipeline execution for run {state.run_id} stopped before {stage}.")
        state.status = "stopped"
        state.active_agent = None
        return state

    state = self._execute_stage(stage, state)

    latest_state = load_run_state(state.run_id)
    if latest_state and latest_state.status in ("stopped", "cancelled"):
        logger.info(f"Pipeline execution for run {state.run_id} stopped after {stage}.")
        state.status = "stopped"
        state.active_agent = None
        return state
```
