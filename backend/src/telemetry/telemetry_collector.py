"""Telemetry, lineage tracking, and observability system."""

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class EventType(Enum):
    """Types of observable events in the pipeline."""
    AGENT_STARTED = "agent_started"
    AGENT_COMPLETED = "agent_completed"
    AGENT_FAILED = "agent_failed"
    AGENT_RETRIED = "agent_retried"
    SUBAGENT_STARTED = "subagent_started"
    SUBAGENT_COMPLETED = "subagent_completed"
    REQUIREMENT_IDENTIFIED = "requirement_identified"
    TEST_GENERATED = "test_generated"
    TEST_EXECUTED = "test_executed"
    ARTIFACT_CREATED = "artifact_created"


class EventSeverity(Enum):
    """Severity levels for events."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AgentTelemetryEvent:
    """Represents a single observable event in the pipeline."""
    event_id: str
    event_type: EventType
    severity: EventSeverity
    agent_id: str
    run_id: str
    timestamp: datetime
    elapsed_ms: int
    message: str
    metadata: Dict[str, Any]
    parent_event_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize event to dict."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "agent_id": self.agent_id,
            "run_id": self.run_id,
            "timestamp": self.timestamp.isoformat(),
            "elapsed_ms": self.elapsed_ms,
            "message": self.message,
            "metadata": self.metadata,
            "parent_event_id": self.parent_event_id,
        }


@dataclass
class LineageNode:
    """Represents an entity in the requirement-to-artifact lineage."""
    node_id: str
    entity_type: str  # "requirement", "test", "artifact", "finding"
    label: str
    description: str
    run_id: str
    created_by: str  # agent_id
    source_file: Optional[str] = None
    line_number: Optional[int] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class LineageEdge:
    """Represents a relationship between lineage nodes."""
    edge_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str  # "validates", "derives_from", "tests", "implements"
    strength: float  # 0.0 to 1.0; confidence in relationship
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class Lineage:
    """Graph of requirement-to-test-to-artifact relationships."""
    
    def __init__(self, run_id: str):
        """Initialize lineage tracker."""
        self.run_id = run_id
        self.nodes: Dict[str, LineageNode] = {}
        self.edges: Dict[str, LineageEdge] = {}
    
    def add_node(self, node: LineageNode) -> None:
        """Add entity node to lineage."""
        self.nodes[node.node_id] = node
    
    def add_edge(self, edge: LineageEdge) -> None:
        """Add relationship edge to lineage."""
        self.edges[edge.edge_id] = edge
    
    def get_descendants(self, node_id: str) -> List[LineageNode]:
        """Find all descendants of a node (test cases from requirement)."""
        descendants = []
        visited = set()
        
        def dfs(nid: str):
            if nid in visited:
                return
            visited.add(nid)
            
            # Find outgoing edges
            for edge in self.edges.values():
                if edge.source_node_id == nid:
                    if edge.target_node_id in self.nodes:
                        descendants.append(self.nodes[edge.target_node_id])
                        dfs(edge.target_node_id)
        
        dfs(node_id)
        return descendants
    
    def get_ancestors(self, node_id: str) -> List[LineageNode]:
        """Find all ancestors of a node (requirements from test)."""
        ancestors = []
        visited = set()
        
        def dfs(nid: str):
            if nid in visited:
                return
            visited.add(nid)
            
            # Find incoming edges
            for edge in self.edges.values():
                if edge.target_node_id == nid:
                    if edge.source_node_id in self.nodes:
                        ancestors.append(self.nodes[edge.source_node_id])
                        dfs(edge.source_node_id)
        
        dfs(node_id)
        return ancestors
    
    def get_path(self, from_node_id: str, to_node_id: str) -> Optional[List[str]]:
        """Find path from one node to another."""
        from collections import deque
        
        queue = deque([(from_node_id, [from_node_id])])
        visited = {from_node_id}
        
        while queue:
            current_id, path = queue.popleft()
            
            if current_id == to_node_id:
                return path
            
            for edge in self.edges.values():
                if edge.source_node_id == current_id and edge.target_node_id not in visited:
                    visited.add(edge.target_node_id)
                    queue.append((edge.target_node_id, path + [edge.target_node_id]))
        
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize lineage to dict."""
        return {
            "run_id": self.run_id,
            "nodes": {nid: {**asdict(node), "metadata": node.metadata} for nid, node in self.nodes.items()},
            "edges": {eid: {**asdict(edge), "metadata": edge.metadata} for eid, edge in self.edges.items()},
        }


class TelemetryCollector:
    """Collects telemetry events and lineage data."""
    
    def __init__(self, run_id: str):
        """Initialize telemetry collector."""
        self.run_id = run_id
        self.events: List[AgentTelemetryEvent] = []
        self.lineage = Lineage(run_id)
        self.start_time = datetime.utcnow()
    
    def record_event(
        self,
        event_type: EventType,
        agent_id: str,
        elapsed_ms: int,
        message: str,
        severity: EventSeverity = EventSeverity.INFO,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Record a telemetry event."""
        if metadata is None:
            metadata = {}
        
        event_id = f"{self.run_id}:{len(self.events)}"
        event = AgentTelemetryEvent(
            event_id=event_id,
            event_type=event_type,
            severity=severity,
            agent_id=agent_id,
            run_id=self.run_id,
            timestamp=datetime.utcnow(),
            elapsed_ms=elapsed_ms,
            message=message,
            metadata=metadata,
        )
        self.events.append(event)
        return event_id
    
    def get_events_by_agent(self, agent_id: str) -> List[AgentTelemetryEvent]:
        """Get all events for a specific agent."""
        return [e for e in self.events if e.agent_id == agent_id]
    
    def get_events_by_type(self, event_type: EventType) -> List[AgentTelemetryEvent]:
        """Get all events of a specific type."""
        return [e for e in self.events if e.event_type == event_type]
    
    def get_failure_events(self) -> List[AgentTelemetryEvent]:
        """Get all failure events."""
        return [e for e in self.events if e.severity in {EventSeverity.ERROR, EventSeverity.CRITICAL}]
    
    def get_total_runtime_ms(self) -> int:
        """Get total pipeline runtime in milliseconds."""
        elapsed = datetime.utcnow() - self.start_time
        return int(elapsed.total_seconds() * 1000)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize telemetry to dict."""
        return {
            "run_id": self.run_id,
            "start_time": self.start_time.isoformat(),
            "total_runtime_ms": self.get_total_runtime_ms(),
            "event_count": len(self.events),
            "failure_count": len(self.get_failure_events()),
            "events": [e.to_dict() for e in self.events],
            "lineage": self.lineage.to_dict(),
        }


class ValidationGate:
    """Validation checkpoint in the pipeline."""
    
    def __init__(self, gate_id: str, description: str, validator_fn):
        """Initialize validation gate."""
        self.gate_id = gate_id
        self.description = description
        self.validator_fn = validator_fn
    
    def validate(self, state: Any) -> tuple[bool, List[str]]:
        """Execute validation. Returns (passed, errors)."""
        try:
            return self.validator_fn(state)
        except Exception as e:
            return False, [str(e)]


class ValidationPipeline:
    """Sequence of validation gates for quality assurance."""
    
    def __init__(self):
        """Initialize validation pipeline."""
        self.gates: List[ValidationGate] = []
    
    def add_gate(self, gate: ValidationGate) -> None:
        """Add validation gate."""
        self.gates.append(gate)
    
    def execute(self, state: Any) -> Dict[str, Any]:
        """Run all validation gates. Returns results."""
        results = {
            "total_gates": len(self.gates),
            "passed_gates": 0,
            "failed_gates": 0,
            "gate_results": [],
        }
        
        for gate in self.gates:
            passed, errors = gate.validate(state)
            results["gate_results"].append({
                "gate_id": gate.gate_id,
                "description": gate.description,
                "passed": passed,
                "errors": errors,
            })
            
            if passed:
                results["passed_gates"] += 1
            else:
                results["failed_gates"] += 1
        
        results["overall_passed"] = results["failed_gates"] == 0
        return results


class RollbackPlaybook:
    """Defines rollback procedures and feature flags for quick disable."""
    
    FEATURE_FLAGS = {
        "enable_requirement_categorization": False,
        "enable_accessibility_scanning": False,
        "enable_parallel_execution": False,
        "enable_queue_system": False,
        "enable_telemetry_collection": True,
    }
    
    @staticmethod
    def quick_disable_flag(flag_name: str) -> bool:
        """Disable a feature flag for rollback."""
        if flag_name in RollbackPlaybook.FEATURE_FLAGS:
            RollbackPlaybook.FEATURE_FLAGS[flag_name] = False
            return True
        return False
    
    @staticmethod
    def enable_flag(flag_name: str) -> bool:
        """Re-enable a feature flag after fix."""
        if flag_name in RollbackPlaybook.FEATURE_FLAGS:
            RollbackPlaybook.FEATURE_FLAGS[flag_name] = True
            return True
        return False
    
    @staticmethod
    def get_status() -> Dict[str, bool]:
        """Get all feature flag statuses."""
        return RollbackPlaybook.FEATURE_FLAGS.copy()
