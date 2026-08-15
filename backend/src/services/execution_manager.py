"""Asynchronous, per-run execution coordination with Pause, Stop, and Resume support."""

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
    paused: bool = False
    paused_at_index: int = 0
    completed_test_case_ids: List[str] = field(default_factory=list)
    remaining_test_case_ids: List[str] = field(default_factory=list)
    future: Optional[Future] = None
    request: Optional[ExecutionRequest] = None


class ExecutionManager:
    """Runs approved jobs and coordinates Pause, Stop, and Resume transitions."""

    def __init__(self) -> None:
        self._executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="qet-execution")
        self._executions: Dict[str, ManagedExecution] = {}
        self._lock = threading.Lock()

    def start(self, state: AppState, request: ExecutionRequest) -> ManagedExecution:
        test_case_node_map: Dict[str, str] = {}
        for script in state.playwright_scripts:
            provenance = getattr(script, "provenance", {}) or {}
            mapping = provenance.get("test_case_node_map", {})
            if isinstance(mapping, dict):
                test_case_node_map.update({str(case_id): str(node_id) for case_id, node_id in mapping.items()})
        
        # If test cases not explicitly mapped, allow any valid test case id from suite
        if state.test_suite and state.test_suite.test_cases:
            for tc in state.test_suite.test_cases:
                test_case_node_map.setdefault(tc.case_id, f"test_{tc.case_id.lower().replace('-', '_')}")

        allowed_case_ids = set(test_case_node_map) or {tc.case_id for tc in (state.test_suite.test_cases if state.test_suite else [])}
        selected = request.test_case_ids or sorted(allowed_case_ids) or ["TC-POS-001", "TC-NEG-001"]

        execution_id = request.execution_id or f"EXEC-{uuid4().hex[:12].upper()}"
        managed = ManagedExecution(
            execution_id=execution_id,
            run_id=state.run_id,
            selected_test_case_ids=selected,
            remaining_test_case_ids=list(selected),
            request=request,
        )
        with self._lock:
            self._executions[execution_id] = managed
        self._persist(managed)
        managed.future = self._executor.submit(self._run, managed, request.model_copy(update={"target_script_ids": [test_case_node_map.get(case_id, case_id) for case_id in selected]}))
        return managed

    def pause(self, execution_id: str) -> ManagedExecution:
        with self._lock:
            managed = self._get(execution_id)
            if managed.status == ExecutionStatus.RUNNING or managed.status == ExecutionStatus.QUEUED:
                managed.paused = True
                managed.status = ExecutionStatus.PAUSED
                managed.current_step = f"Paused at test case {managed.current_test_case_id or 'queue'}"
                managed.logs.append(f"Execution paused by user at {datetime.now(timezone.utc).strftime('%H:%M:%S')}.")
                self._persist(managed)
            return managed

    def resume(self, execution_id: str) -> ManagedExecution:
        with self._lock:
            managed = self._get(execution_id)
            if managed.status == ExecutionStatus.PAUSED:
                managed.paused = False
                managed.cancelled = False
                managed.status = ExecutionStatus.RUNNING
                managed.current_step = f"Resuming execution from test case {managed.current_test_case_id or 'queue'}"
                managed.logs.append(f"Execution resumed by user at {datetime.now(timezone.utc).strftime('%H:%M:%S')}.")
                self._persist(managed)
                if managed.request:
                    managed.future = self._executor.submit(self._run, managed, managed.request)
            return managed

    def stop(self, execution_id: str) -> ManagedExecution:
        with self._lock:
            managed = self._get(execution_id)
            managed.cancelled = True
            managed.paused = False
            if managed.future:
                managed.future.cancel()
            managed.status = ExecutionStatus.STOPPED
            managed.current_step = "Execution stopped by user"
            managed.logs.append(f"Execution stopped by user at {datetime.now(timezone.utc).strftime('%H:%M:%S')}.")
            self._persist(managed)
            return managed

    def cancel(self, execution_id: str) -> ManagedExecution:
        return self.stop(execution_id)

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
        with self._lock:
            if managed.cancelled:
                return
            managed.status = ExecutionStatus.RUNNING
            managed.current_test_case_id = managed.selected_test_case_ids[0] if managed.selected_test_case_ids else None
            managed.current_step = "Starting approved Playwright execution in new headed desktop window"
            managed.logs.append(f"Execution started for {len(managed.selected_test_case_ids)} test case(s) in headed desktop window.")
            self._persist(managed)

        try:
            result = ExecutionEngine(run_id=managed.run_id).execute(
                request,
                is_non_production_confirmed=request.is_non_production_confirmed,
                is_script_reviewed=request.is_script_reviewed,
                headed=True,
            )
            with self._lock:
                managed.result = result
                if managed.cancelled:
                    managed.status = ExecutionStatus.STOPPED
                elif managed.paused:
                    managed.status = ExecutionStatus.PAUSED
                else:
                    managed.status = result.status
                managed.current_step = f"Execution {managed.status.value}"
                managed.logs.extend(result.execution_logs)
                self._persist(managed)
        except Exception as exc:
            with self._lock:
                managed.status = ExecutionStatus.FAILED
                managed.current_step = "Execution failed before completion"
                managed.logs.append(f"Execution Exception: {exc}")
                self._persist(managed)

    def _get(self, execution_id: str) -> ManagedExecution:
        managed = self._executions.get(execution_id)
        if not managed:
            # Try to restore from disk
            for path in Path("uploads").glob(f"*/artifacts/executions/{execution_id}/state.json"):
                try:
                    data = json.loads(path.read_text(encoding="utf-8"))
                    managed = ManagedExecution(
                        execution_id=data.get("execution_id", execution_id),
                        run_id=data.get("run_id", ""),
                        selected_test_case_ids=data.get("selected_test_case_ids", []),
                        status=ExecutionStatus(data.get("status", "idle")),
                        current_test_case_id=data.get("current_test_case_id"),
                        current_step=data.get("current_step"),
                        logs=data.get("logs", []),
                    )
                    self._executions[execution_id] = managed
                    return managed
                except Exception:
                    pass
            raise KeyError(execution_id)
        return managed

    @staticmethod
    def _persist(managed: ManagedExecution) -> None:
        path = Path("uploads") / managed.run_id / "artifacts" / "executions" / managed.execution_id / "state.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(
                {
                    "execution_id": managed.execution_id,
                    "run_id": managed.run_id,
                    "status": managed.status.value,
                    "selected_test_case_ids": managed.selected_test_case_ids,
                    "current_test_case_id": managed.current_test_case_id,
                    "current_step": managed.current_step,
                    "logs": managed.logs,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                indent=2,
            ),
            encoding="utf-8",
        )


execution_manager = ExecutionManager()

