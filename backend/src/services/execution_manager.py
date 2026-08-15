"""Asynchronous, per-run execution coordination for approved Playwright jobs."""

import json
import threading
from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

from schemas.contracts import AppState, ExecutionRequest, ExecutionResult, ExecutionStatus, ExecutionStatusResponse
from src.services.execution_engine import ExecutionEngine
from src.utils.logger import log_run_context


@dataclass
class ManagedExecution:
    execution_id: str
    run_id: str
    selected_test_case_ids: List[str]
    status: ExecutionStatus = ExecutionStatus.QUEUED
    current_test_case_id: Optional[str] = None
    current_step: Optional[str] = None
    logs: List[str] = field(default_factory=list)
    result: Optional[ExecutionResult] = None
    cancelled: bool = False
    future: Optional[Future] = None


class ExecutionManager:
    """Runs one approved job at a time and exposes durable status snapshots."""

    def __init__(self) -> None:
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="qet-execution")
        self._executions: Dict[str, ManagedExecution] = {}
        self._lock = threading.Lock()

    def start(self, state: AppState, request: ExecutionRequest) -> ManagedExecution:
        test_case_node_map: Dict[str, str] = {}
        for script in state.playwright_scripts:
            provenance = getattr(script, "provenance", {}) or {}
            mapping = provenance.get("test_case_node_map", {})
            if isinstance(mapping, dict):
                test_case_node_map.update({str(case_id): str(node_id) for case_id, node_id in mapping.items()})
        allowed_case_ids = set(test_case_node_map)
        selected = request.test_case_ids or sorted(allowed_case_ids)
        if not selected:
            raise ValueError("No generated test cases are available for execution.")
        unknown = sorted(set(selected) - allowed_case_ids)
        if unknown:
            raise ValueError(f"Selected test cases do not have generated runnable scripts: {', '.join(unknown)}")

        execution_id = request.execution_id or f"EXEC-{uuid4().hex[:12].upper()}"
        managed = ManagedExecution(execution_id=execution_id, run_id=state.run_id, selected_test_case_ids=selected)
        with self._lock:
            self._executions[execution_id] = managed
        self._persist(managed)
        managed.future = self._executor.submit(self._run, managed, request.model_copy(update={"target_script_ids": [test_case_node_map[case_id] for case_id in selected]}))
        return managed

    def cancel(self, execution_id: str) -> ManagedExecution:
        with self._lock:
            managed = self._get(execution_id)
            if managed.status == ExecutionStatus.QUEUED:
                managed.cancelled = True
                if managed.future:
                    managed.future.cancel()
                managed.status = ExecutionStatus.CANCELLED
                managed.logs.append("Execution cancelled before the subprocess started.")
                self._persist(managed)
                return managed
            if managed.status == ExecutionStatus.RUNNING:
                managed.cancelled = True
                managed.logs.append("Cancellation requested; the current subprocess will finish its active command.")
                self._persist(managed)
            return managed

    def snapshot(self, execution_id: str) -> ExecutionStatusResponse:
        with self._lock:
            managed = self._get(execution_id)
            return ExecutionStatusResponse(
                execution_id=managed.execution_id,
                run_id=managed.run_id,
                status=managed.status,
                selected_test_case_ids=managed.selected_test_case_ids,
                current_test_case_id=managed.current_test_case_id,
                current_step=managed.current_step,
                logs=managed.logs[-50:],
                result=managed.result,
            )

    def _run(self, managed: ManagedExecution, request: ExecutionRequest) -> None:
        with log_run_context(managed.run_id):
            self._run_internal(managed, request)

    def _run_internal(self, managed: ManagedExecution, request: ExecutionRequest) -> None:
        with self._lock:
            if managed.cancelled:
                return
            managed.status = ExecutionStatus.RUNNING
            managed.current_test_case_id = managed.selected_test_case_ids[0]
            managed.current_step = "Starting approved Playwright execution"
            managed.logs.append(f"Execution started for {len(managed.selected_test_case_ids)} selected test case(s).")
            self._persist(managed)
        try:
            result = ExecutionEngine(run_id=managed.run_id).execute(
                request,
                is_non_production_confirmed=request.is_non_production_confirmed,
                is_script_reviewed=request.is_script_reviewed,
            )
            with self._lock:
                managed.result = result
                managed.status = ExecutionStatus.CANCELLED if managed.cancelled else result.status
                managed.current_step = "Execution complete"
                managed.logs.extend(result.execution_logs)
                self._persist(managed)
        except Exception as exc:
            with self._lock:
                managed.status = ExecutionStatus.FAILED
                managed.current_step = "Execution failed before completion"
                managed.logs.append(str(exc))
                self._persist(managed)

    def _get(self, execution_id: str) -> ManagedExecution:
        managed = self._executions.get(execution_id)
        if not managed:
            raise KeyError(execution_id)
        return managed

    @staticmethod
    def _persist(managed: ManagedExecution) -> None:
        path = Path("uploads") / managed.run_id / "artifacts" / "executions" / managed.execution_id / "state.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"execution_id": managed.execution_id, "run_id": managed.run_id, "status": managed.status.value, "selected_test_case_ids": managed.selected_test_case_ids, "current_test_case_id": managed.current_test_case_id, "current_step": managed.current_step, "logs": managed.logs, "updated_at": datetime.now(timezone.utc).isoformat()}, indent=2), encoding="utf-8")


execution_manager = ExecutionManager()