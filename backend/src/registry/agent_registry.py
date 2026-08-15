"""Centralized agent registry for multi-agent orchestration platform."""

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class RetryPolicy(Enum):
    """Retry policy strategies for agent invocation."""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    NO_RETRY = "no_retry"


class FailureClass(Enum):
    """Classification of failure types for recovery routing."""
    TRANSIENT_NETWORK = "transient_network"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    MISCONFIGURATION = "misconfiguration"
    CONTRACT_VALIDATION = "contract_validation"
    INTERNAL_RUNTIME = "internal_runtime"
    RESOURCE_EXHAUSTED = "resource_exhausted"


@dataclass
class AgentCapability:
    """Describes a single capability of an agent."""
    name: str
    description: str
    version: str


@dataclass
class AgentDependency:
    """Describes dependencies between agents."""
    agent_id: str
    required_fields: List[str]
    stage_before_me: Optional[str] = None
    stage_after_me: Optional[str] = None


@dataclass
class RetryConfig:
    """Configuration for agent retry behavior."""
    policy: RetryPolicy
    max_attempts: int
    initial_backoff_ms: int
    max_backoff_ms: int
    multiplier: float = 2.0
    failure_classes_retryable: List[FailureClass] = None
    
    def __post_init__(self):
        if self.failure_classes_retryable is None:
            self.failure_classes_retryable = [
                FailureClass.TRANSIENT_NETWORK,
                FailureClass.PROVIDER_UNAVAILABLE,
            ]


@dataclass
class AgentRegistryEntry:
    """Registry entry for a single agent."""
    agent_id: str
    class_name: str
    file_path: str
    version: str
    stage_order: int  # 1-indexed; 0 for optional/parallel
    owner_team: str
    capabilities: List[AgentCapability]
    dependencies: List[AgentDependency]
    input_contract: Dict[str, Any]  # JSON schema or field names
    output_contract: Dict[str, Any]
    artifact_paths: List[str]
    timeout_seconds: int
    retry_config: RetryConfig
    requires_ai_provider: bool
    fallback_mode: str  # e.g., "deterministic_fallback", "graceful_degradation", "hard_fail"
    feature_flag: Optional[str] = None  # e.g., "enable_accessibility_scanning"
    created_at: datetime = None
    last_updated: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.last_updated is None:
            self.last_updated = datetime.utcnow()


class AgentRegistry:
    """Central registry for all agents in the QET platform."""
    
    def __init__(self):
        """Initialize empty registry."""
        self._agents: Dict[str, AgentRegistryEntry] = {}
    
    def register(self, entry: AgentRegistryEntry) -> None:
        """Register an agent in the registry."""
        self._agents[entry.agent_id] = entry
    
    def get(self, agent_id: str) -> Optional[AgentRegistryEntry]:
        """Retrieve agent metadata by ID."""
        return self._agents.get(agent_id)
    
    def list_all(self) -> List[AgentRegistryEntry]:
        """List all registered agents."""
        return sorted(list(self._agents.values()), key=lambda e: e.stage_order)
    
    def list_by_stage(self) -> Dict[int, List[AgentRegistryEntry]]:
        """Return agents grouped by stage order."""
        by_stage: Dict[int, List[AgentRegistryEntry]] = {}
        for entry in self._agents.values():
            stage = entry.stage_order
            if stage not in by_stage:
                by_stage[stage] = []
            by_stage[stage].append(entry)
        return {k: sorted(v, key=lambda e: e.agent_id) for k, v in sorted(by_stage.items())}
    
    def list_enabled(self, feature_flags: Dict[str, bool]) -> List[AgentRegistryEntry]:
        """List agents that are enabled given feature flags."""
        enabled = []
        for entry in self._agents.values():
            if entry.feature_flag is None:
                enabled.append(entry)
            elif feature_flags.get(entry.feature_flag, False):
                enabled.append(entry)
        return sorted(enabled, key=lambda e: e.stage_order)
    
    def get_dependency_graph(self) -> Dict[str, List[str]]:
        """Return adjacency list of agent dependencies."""
        graph: Dict[str, List[str]] = {entry.agent_id: [] for entry in self._agents.values()}
        for entry in self._agents.values():
            for dep in entry.dependencies:
                if dep.agent_id in graph:
                    graph[dep.agent_id].append(entry.agent_id)
        return graph
    
    def validate_dependencies(self) -> List[str]:
        """Validate all dependencies reference registered agents. Return list of errors."""
        errors = []
        for entry in self._agents.values():
            for dep in entry.dependencies:
                if dep.agent_id not in self._agents:
                    errors.append(f"{entry.agent_id} depends on unregistered agent {dep.agent_id}")
        return errors
    
    def to_json(self) -> str:
        """Serialize registry to JSON."""
        data = {
            agent_id: {
                **asdict(entry),
                "created_at": entry.created_at.isoformat(),
                "last_updated": entry.last_updated.isoformat(),
                "retry_config": {
                    "policy": entry.retry_config.policy.value,
                    "max_attempts": entry.retry_config.max_attempts,
                    "initial_backoff_ms": entry.retry_config.initial_backoff_ms,
                    "max_backoff_ms": entry.retry_config.max_backoff_ms,
                    "multiplier": entry.retry_config.multiplier,
                    "failure_classes_retryable": [fc.value for fc in entry.retry_config.failure_classes_retryable],
                },
                "capabilities": [asdict(c) for c in entry.capabilities],
                "dependencies": [asdict(d) for d in entry.dependencies],
            }
            for agent_id, entry in self._agents.items()
        }
        return json.dumps(data, indent=2)


# Global registry instance
_global_registry: Optional[AgentRegistry] = None


def get_registry() -> AgentRegistry:
    """Get or create the global agent registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = AgentRegistry()
        _initialize_registry(_global_registry)
    return _global_registry


def _initialize_registry(registry: AgentRegistry) -> None:
    """Initialize registry with all known agents."""
    from src.config import config
    
    # Understanding Agent
    registry.register(AgentRegistryEntry(
        agent_id="understanding",
        class_name="UnderstandingAgent",
        file_path="src/agents/understanding_agent.py",
        version="1.0.0",
        stage_order=1,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("requirement_parsing", "Extracts and validates requirements from documents", "1.0.0"),
            AgentCapability("ui_synthesis", "Synthesizes UI inventory from source code", "1.0.0"),
        ],
        dependencies=[],
        input_contract={"intake_manifest": "required"},
        output_contract={"understanding": "ApplicationUnderstanding"},
        artifact_paths=["understanding_report.json"],
        timeout_seconds=300,
        retry_config=RetryConfig(
            policy=RetryPolicy.EXPONENTIAL_BACKOFF,
            max_attempts=3,
            initial_backoff_ms=1000,
            max_backoff_ms=30000,
        ),
        requires_ai_provider=True,
        fallback_mode="deterministic_fallback",
    ))
    
    # Requirement Categorization Agent (optional)
    registry.register(AgentRegistryEntry(
        agent_id="requirement_categorization",
        class_name="RequirementCategorizer",
        file_path="src/agents/requirement_categorizer.py",
        version="1.0.0",
        stage_order=2,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("categorization", "Classifies requirements into functional/non-functional/quality categories", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="understanding", required_fields=["understanding"])
        ],
        input_contract={"understanding": "required"},
        output_contract={"requirement_categories": "List[RequirementCategory]"},
        artifact_paths=["requirement_categories.json"],
        timeout_seconds=60,
        retry_config=RetryConfig(
            policy=RetryPolicy.LINEAR_BACKOFF,
            max_attempts=2,
            initial_backoff_ms=500,
            max_backoff_ms=5000,
        ),
        requires_ai_provider=True,
        fallback_mode="graceful_degradation",
        feature_flag="enable_requirement_categorization",
    ))
    
    # Accessibility Agent (optional)
    registry.register(AgentRegistryEntry(
        agent_id="accessibility",
        class_name="AccessibilityAgent",
        file_path="src/agents/accessibility_agent.py",
        version="1.0.0",
        stage_order=3,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("wcag_scanning", "Static WCAG 2.1 A/AA compliance scanning", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="understanding", required_fields=["intake_manifest"])
        ],
        input_contract={"intake_manifest": "required"},
        output_contract={"accessibility_report": "AccessibilityReport"},
        artifact_paths=["accessibility_report.json"],
        timeout_seconds=120,
        retry_config=RetryConfig(
            policy=RetryPolicy.NO_RETRY,
            max_attempts=1,
            initial_backoff_ms=0,
            max_backoff_ms=0,
        ),
        requires_ai_provider=False,
        fallback_mode="hard_fail",
        feature_flag="enable_accessibility_scanning",
    ))
    
    # Test Case Agent
    registry.register(AgentRegistryEntry(
        agent_id="test_cases",
        class_name="TestCaseAgent",
        file_path="src/agents/test_case_agent.py",
        version="1.0.0",
        stage_order=4,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("test_generation", "Generates positive/negative/edge-case test suites", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="understanding", required_fields=["understanding"])
        ],
        input_contract={"understanding": "required"},
        output_contract={"test_suite": "TestSuite"},
        artifact_paths=["test_cases.json", "test_matrix.csv"],
        timeout_seconds=180,
        retry_config=RetryConfig(
            policy=RetryPolicy.EXPONENTIAL_BACKOFF,
            max_attempts=3,
            initial_backoff_ms=1000,
            max_backoff_ms=30000,
        ),
        requires_ai_provider=True,
        fallback_mode="graceful_degradation",
    ))
    
    # Test Data Agent
    registry.register(AgentRegistryEntry(
        agent_id="test_data",
        class_name="TestDataAgent",
        file_path="src/agents/test_data_agent.py",
        version="1.0.0",
        stage_order=5,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("data_synthesis", "Generates synthetic, non-PII test data", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="test_cases", required_fields=["test_suite"])
        ],
        input_contract={"test_suite": "required"},
        output_contract={"synthetic_dataset": "SyntheticDataset"},
        artifact_paths=["synthetic_data.json", "data_schema.json"],
        timeout_seconds=120,
        retry_config=RetryConfig(
            policy=RetryPolicy.LINEAR_BACKOFF,
            max_attempts=2,
            initial_backoff_ms=500,
            max_backoff_ms=5000,
        ),
        requires_ai_provider=False,
        fallback_mode="graceful_degradation",
    ))
    
    # Script Writer Agent (Playwright)
    registry.register(AgentRegistryEntry(
        agent_id="playwright",
        class_name="PlaywrightAgent",
        file_path="src/agents/playwright_agent.py",
        version="1.0.0",
        stage_order=6,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("script_generation", "Generates Playwright page objects and test scripts", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="test_cases", required_fields=["test_suite"]),
            AgentDependency(agent_id="test_data", required_fields=["synthetic_dataset"]),
        ],
        input_contract={"test_suite": "required", "synthetic_dataset": "required"},
        output_contract={"playwright_scripts": "List[PlaywrightScript]"},
        artifact_paths=["playwright_tests.js", "page_objects.js"],
        timeout_seconds=180,
        retry_config=RetryConfig(
            policy=RetryPolicy.EXPONENTIAL_BACKOFF,
            max_attempts=2,
            initial_backoff_ms=1000,
            max_backoff_ms=15000,
        ),
        requires_ai_provider=True,
        fallback_mode="graceful_degradation",
    ))
    
    # Report Agent
    registry.register(AgentRegistryEntry(
        agent_id="report",
        class_name="ReportAgent",
        file_path="src/agents/report_agent.py",
        version="1.0.0",
        stage_order=7,
        owner_team="QET-Core",
        capabilities=[
            AgentCapability("report_generation", "Generates quality reports and result artifacts", "1.0.0"),
        ],
        dependencies=[
            AgentDependency(agent_id="test_cases", required_fields=["test_suite"]),
            AgentDependency(agent_id="playwright", required_fields=["playwright_scripts"]),
        ],
        input_contract={"test_suite": "required", "playwright_scripts": "required"},
        output_contract={"latest_report": "QualityReport"},
        artifact_paths=["quality_report.html", "quality_report.pdf"],
        timeout_seconds=120,
        retry_config=RetryConfig(
            policy=RetryPolicy.LINEAR_BACKOFF,
            max_attempts=2,
            initial_backoff_ms=500,
            max_backoff_ms=5000,
        ),
        requires_ai_provider=False,
        fallback_mode="hard_fail",
    ))
