"""Orchestration engine with retry policies and failure classification."""

import asyncio
import time
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from src.models.schemas import AppState
from src.registry.agent_registry import (
    AgentRegistry,
    FailureClass,
    RetryPolicy,
    get_registry,
)


class RecoveryAction(Enum):
    """Actions to take when an agent fails."""
    RETRY_SAME_AGENT = "retry_same_agent"
    SKIP_TO_NEXT = "skip_to_next"
    FALLBACK_MODE = "fallback_mode"
    ABORT_PIPELINE = "abort_pipeline"
    RESUME_AFTER_FIX = "resume_after_fix"


class ExecutionFailure:
    """Represents an agent execution failure with classification."""
    
    def __init__(
        self,
        agent_id: str,
        failure_class: FailureClass,
        error_message: str,
        attempt: int,
        elapsed_ms: int,
    ):
        self.agent_id = agent_id
        self.failure_class = failure_class
        self.error_message = error_message
        self.attempt = attempt
        self.elapsed_ms = elapsed_ms
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize failure to dict."""
        return {
            "agent_id": self.agent_id,
            "failure_class": self.failure_class.value,
            "error_message": self.error_message,
            "attempt": self.attempt,
            "elapsed_ms": self.elapsed_ms,
            "timestamp": self.timestamp,
        }


class FailureClassifier:
    """Classifies exceptions into failure categories for routing."""
    
    @staticmethod
    def classify(agent_id: str, error: Exception) -> FailureClass:
        """Classify an exception into a FailureClass."""
        error_msg = str(error).lower()
        
        # Network errors
        if any(keyword in error_msg for keyword in ["connection", "timeout", "socket", "network"]):
            return FailureClass.TRANSIENT_NETWORK
        
        # Provider errors
        if any(keyword in error_msg for keyword in ["provider", "api", "key", "auth", "unauthorized"]):
            return FailureClass.PROVIDER_UNAVAILABLE
        
        # Configuration errors
        if any(keyword in error_msg for keyword in ["config", "env", "missing", "not found"]):
            return FailureClass.MISCONFIGURATION
        
        # Validation errors
        if any(keyword in error_msg for keyword in ["validation", "schema", "contract", "invalid"]):
            return FailureClass.CONTRACT_VALIDATION
        
        # Resource exhaustion
        if any(keyword in error_msg for keyword in ["memory", "space", "quota", "limit", "exhausted"]):
            return FailureClass.RESOURCE_EXHAUSTED
        
        # Default to runtime error
        return FailureClass.INTERNAL_RUNTIME


class RetryCalculator:
    """Calculates retry backoff and decisions."""
    
    @staticmethod
    def should_retry(failure: ExecutionFailure, retry_config) -> bool:
        """Determine if an agent should be retried based on failure class."""
        if failure.attempt >= retry_config.max_attempts:
            return False
        
        if failure.failure_class not in retry_config.failure_classes_retryable:
            return False
        
        return True
    
    @staticmethod
    def calculate_backoff_ms(
        policy: RetryPolicy,
        attempt: int,
        initial_ms: int,
        max_ms: int,
        multiplier: float = 2.0,
    ) -> int:
        """Calculate backoff duration for retry."""
        if policy == RetryPolicy.NO_RETRY:
            return 0
        
        if policy == RetryPolicy.EXPONENTIAL_BACKOFF:
            backoff = initial_ms * (multiplier ** (attempt - 1))
            return min(int(backoff), max_ms)
        
        if policy == RetryPolicy.LINEAR_BACKOFF:
            backoff = initial_ms * attempt
            return min(backoff, max_ms)
        
        return 0


class OrchestrationEngine:
    """Manages agent execution with retry, dependency, and failure handling."""
    
    def __init__(self, registry: Optional[AgentRegistry] = None):
        """Initialize orchestration engine."""
        self.registry = registry or get_registry()
        self.failure_classifier = FailureClassifier()
        self.retry_calculator = RetryCalculator()
    
    def get_execution_order(self, state: AppState) -> List[str]:
        """Get ordered list of agents to execute based on dependencies and flags."""
        from src.config import config
        
        enabled_agents = self.registry.list_enabled(vars(config.features))
        order = []
        seen = set()
        
        # Topological sort by stage_order
        for stage_entry in sorted(
            enabled_agents,
            key=lambda e: (e.stage_order, e.agent_id)
        ):
            if stage_entry.agent_id not in seen:
                order.append(stage_entry.agent_id)
                seen.add(stage_entry.agent_id)
        
        return order
    
    def validate_state_for_agent(self, state: AppState, agent_id: str) -> Tuple[bool, List[str]]:
        """Check if AppState has required fields for agent execution."""
        entry = self.registry.get(agent_id)
        if not entry:
            return False, [f"Unknown agent: {agent_id}"]
        
        errors = []
        required_fields = entry.input_contract.get("required_fields", [])
        
        for field in required_fields:
            if not hasattr(state, field) or getattr(state, field) is None:
                errors.append(f"Missing required field for {agent_id}: {field}")
        
        return len(errors) == 0, errors
    
    def route_failure(self, failure: ExecutionFailure) -> RecoveryAction:
        """Route a failure to a recovery action."""
        entry = self.registry.get(failure.agent_id)
        if not entry:
            return RecoveryAction.ABORT_PIPELINE
        
        retry_config = entry.retry_config
        
        # Check if should retry
        if self.retry_calculator.should_retry(failure, retry_config):
            return RecoveryAction.RETRY_SAME_AGENT
        
        # Check fallback mode
        if entry.fallback_mode == "graceful_degradation":
            return RecoveryAction.SKIP_TO_NEXT
        elif entry.fallback_mode == "deterministic_fallback":
            return RecoveryAction.FALLBACK_MODE
        
        return RecoveryAction.ABORT_PIPELINE
    
    def calculate_retry_delay(self, failure: ExecutionFailure) -> int:
        """Calculate delay before retry in milliseconds."""
        entry = self.registry.get(failure.agent_id)
        if not entry or entry.retry_config.policy == RetryPolicy.NO_RETRY:
            return 0
        
        return self.retry_calculator.calculate_backoff_ms(
            policy=entry.retry_config.policy,
            attempt=failure.attempt,
            initial_ms=entry.retry_config.initial_backoff_ms,
            max_ms=entry.retry_config.max_backoff_ms,
            multiplier=getattr(entry.retry_config, "multiplier", 2.0),
        )
    
    def build_idempotency_key(self, agent_id: str, state: AppState) -> str:
        """Build idempotency key for deduplication."""
        return f"{state.run_id}:{agent_id}:{state.reset_generation}"
    
    def is_idempotent_safe(self, agent_id: str) -> bool:
        """Check if agent is idempotent (safe to retry)."""
        # For now, most agents are idempotent
        # Exceptions: agents that modify external state
        return agent_id not in {"execution_engine"}
    
    async def execute_with_retry(
        self,
        agent_id: str,
        execute_fn: Callable[[AppState], AppState],
        state: AppState,
    ) -> Tuple[AppState, Optional[ExecutionFailure]]:
        """Execute agent with automatic retry logic."""
        entry = self.registry.get(agent_id)
        if not entry:
            error = ExecutionFailure(
                agent_id=agent_id,
                failure_class=FailureClass.MISCONFIGURATION,
                error_message=f"Unknown agent: {agent_id}",
                attempt=1,
                elapsed_ms=0,
            )
            return state, error
        
        attempt = 0
        last_error: Optional[ExecutionFailure] = None
        
        while attempt < entry.retry_config.max_attempts:
            attempt += 1
            start_time = time.time()
            
            try:
                result_state = execute_fn(state)
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                # Check timeout
                if elapsed_ms > entry.timeout_seconds * 1000:
                    last_error = ExecutionFailure(
                        agent_id=agent_id,
                        failure_class=FailureClass.INTERNAL_RUNTIME,
                        error_message=f"Agent timeout after {elapsed_ms}ms",
                        attempt=attempt,
                        elapsed_ms=elapsed_ms,
                    )
                    continue
                
                return result_state, None
                
            except Exception as e:
                elapsed_ms = int((time.time() - start_time) * 1000)
                failure_class = self.failure_classifier.classify(agent_id, e)
                last_error = ExecutionFailure(
                    agent_id=agent_id,
                    failure_class=failure_class,
                    error_message=str(e),
                    attempt=attempt,
                    elapsed_ms=elapsed_ms,
                )
                
                if attempt < entry.retry_config.max_attempts:
                    delay_ms = self.calculate_retry_delay(last_error)
                    if delay_ms > 0:
                        await asyncio.sleep(delay_ms / 1000.0)
        
        return state, last_error
