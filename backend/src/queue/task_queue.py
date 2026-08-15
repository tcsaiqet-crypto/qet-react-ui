"""Task queue system for resilient agent execution."""

import json
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class JobStatus(Enum):
    """Lifecycle states for a job."""
    PENDING = "pending"
    QUEUED = "queued"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    DEAD_LETTER = "dead_letter"


class JobPriority(Enum):
    """Priority levels for job scheduling."""
    LOW = 3
    NORMAL = 2
    HIGH = 1
    CRITICAL = 0


@dataclass
class Job:
    """Represents a single agent execution job."""
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str = ""
    agent_id: str = ""
    status: JobStatus = JobStatus.PENDING
    priority: JobPriority = JobPriority.NORMAL
    state_snapshot: Dict[str, Any] = field(default_factory=dict)
    attempt: int = 1
    max_attempts: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None
    error_message: Optional[str] = None
    error_class: Optional[str] = None
    result_snapshot: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize job to dict."""
        return {
            "job_id": self.job_id,
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "status": self.status.value,
            "priority": self.priority.name,
            "attempt": self.attempt,
            "max_attempts": self.max_attempts,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "next_retry_at": self.next_retry_at.isoformat() if self.next_retry_at else None,
            "error_message": self.error_message,
            "error_class": self.error_class,
            "metadata": self.metadata,
        }


@dataclass
class QueueStats:
    """Statistics about queue health."""
    total_jobs: int = 0
    pending_jobs: int = 0
    executing_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    dead_letter_jobs: int = 0
    avg_execution_time_ms: float = 0.0
    oldest_pending_job_age_ms: float = 0.0


class TaskQueue(ABC):
    """Abstract base class for task queues."""
    
    @abstractmethod
    def enqueue(self, job: Job) -> str:
        """Add job to queue. Returns job_id."""
        pass
    
    @abstractmethod
    def dequeue(self) -> Optional[Job]:
        """Remove and return next job from queue."""
        pass
    
    @abstractmethod
    def get(self, job_id: str) -> Optional[Job]:
        """Retrieve job by ID."""
        pass
    
    @abstractmethod
    def update_status(self, job_id: str, status: JobStatus) -> bool:
        """Update job status. Returns success."""
        pass
    
    @abstractmethod
    def mark_complete(self, job_id: str, result: Dict[str, Any]) -> bool:
        """Mark job as completed."""
        pass
    
    @abstractmethod
    def mark_failed(self, job_id: str, error_message: str, error_class: str) -> bool:
        """Mark job as failed."""
        pass
    
    @abstractmethod
    def list_by_status(self, status: JobStatus) -> List[Job]:
        """List all jobs with given status."""
        pass
    
    @abstractmethod
    def get_stats(self) -> QueueStats:
        """Get queue statistics."""
        pass
    
    @abstractmethod
    def clear_dead_letters(self, older_than_hours: int = 24) -> int:
        """Remove dead-letter jobs older than N hours. Returns count removed."""
        pass


class InMemoryQueue(TaskQueue):
    """In-memory task queue implementation (MVP)."""
    
    def __init__(self):
        """Initialize in-memory queue."""
        self.jobs: Dict[str, Job] = {}
        self.queue: List[str] = []  # job_ids in order
        self.dead_letter: List[str] = []  # job_ids in dead letter
    
    def enqueue(self, job: Job) -> str:
        """Add job to queue."""
        self.jobs[job.job_id] = job
        job.status = JobStatus.QUEUED
        self.queue.append(job.job_id)
        return job.job_id
    
    def dequeue(self) -> Optional[Job]:
        """Remove and return next job from queue."""
        # Sort by priority, then by enqueue time
        if not self.queue:
            return None
        
        # Find highest priority job
        best_idx = 0
        best_job = self.jobs[self.queue[best_idx]]
        
        for i, job_id in enumerate(self.queue):
            job = self.jobs[job_id]
            if job.priority.value < best_job.priority.value:
                best_idx = i
                best_job = job
        
        job_id = self.queue.pop(best_idx)
        job = self.jobs[job_id]
        job.status = JobStatus.EXECUTING
        job.started_at = datetime.utcnow()
        return job
    
    def get(self, job_id: str) -> Optional[Job]:
        """Retrieve job by ID."""
        return self.jobs.get(job_id)
    
    def update_status(self, job_id: str, status: JobStatus) -> bool:
        """Update job status."""
        if job_id not in self.jobs:
            return False
        self.jobs[job_id].status = status
        return True
    
    def mark_complete(self, job_id: str, result: Dict[str, Any]) -> bool:
        """Mark job as completed."""
        if job_id not in self.jobs:
            return False
        job = self.jobs[job_id]
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.utcnow()
        job.result_snapshot = result
        return True
    
    def mark_failed(self, job_id: str, error_message: str, error_class: str) -> bool:
        """Mark job as failed."""
        if job_id not in self.jobs:
            return False
        job = self.jobs[job_id]
        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.error_class = error_class
        job.completed_at = datetime.utcnow()
        return True
    
    def list_by_status(self, status: JobStatus) -> List[Job]:
        """List all jobs with given status."""
        return [job for job in self.jobs.values() if job.status == status]
    
    def get_stats(self) -> QueueStats:
        """Get queue statistics."""
        stats = QueueStats(total_jobs=len(self.jobs))
        
        for job in self.jobs.values():
            if job.status == JobStatus.PENDING:
                stats.pending_jobs += 1
            elif job.status == JobStatus.EXECUTING:
                stats.executing_jobs += 1
            elif job.status == JobStatus.COMPLETED:
                stats.completed_jobs += 1
            elif job.status == JobStatus.FAILED:
                stats.failed_jobs += 1
            elif job.status == JobStatus.DEAD_LETTER:
                stats.dead_letter_jobs += 1
        
        # Calculate avg execution time
        completed = [job for job in self.jobs.values() if job.completed_at and job.started_at]
        if completed:
            times = [(job.completed_at - job.started_at).total_seconds() * 1000 for job in completed]
            stats.avg_execution_time_ms = sum(times) / len(times)
        
        return stats
    
    def clear_dead_letters(self, older_than_hours: int = 24) -> int:
        """Remove dead-letter jobs older than N hours."""
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=older_than_hours)
        to_remove = [
            job_id for job_id, job in self.jobs.items()
            if job.status == JobStatus.DEAD_LETTER and job.completed_at and job.completed_at < cutoff
        ]
        
        for job_id in to_remove:
            del self.jobs[job_id]
            if job_id in self.dead_letter:
                self.dead_letter.remove(job_id)
        
        return len(to_remove)


class QueueManager:
    """High-level queue management with consistency checks."""
    
    def __init__(self, queue: Optional[TaskQueue] = None):
        """Initialize queue manager."""
        self.queue = queue or InMemoryQueue()
    
    def submit_job(self, run_id: str, agent_id: str, priority: JobPriority = JobPriority.NORMAL) -> Job:
        """Submit a new job for execution."""
        job = Job(
            run_id=run_id,
            agent_id=agent_id,
            priority=priority,
        )
        self.queue.enqueue(job)
        return job
    
    def get_next_executable_job(self) -> Optional[Job]:
        """Get next job to execute."""
        job = self.queue.dequeue()
        if job:
            self.queue.update_status(job.job_id, JobStatus.EXECUTING)
        return job
    
    def mark_job_complete(self, job_id: str, result: Dict[str, Any]) -> bool:
        """Mark job as successfully completed."""
        return self.queue.mark_complete(job_id, result)
    
    def mark_job_failed(self, job_id: str, error_message: str, error_class: str, retry: bool = True) -> bool:
        """Mark job as failed. If retry=True and attempts remain, requeue."""
        if not self.queue.mark_failed(job_id, error_message, error_class):
            return False
        
        job = self.queue.get(job_id)
        if not job:
            return False
        
        if retry and job.attempt < job.max_attempts:
            job.attempt += 1
            job.status = JobStatus.RETRYING
            # Requeue the job
            from datetime import timedelta
            job.next_retry_at = datetime.utcnow() + timedelta(seconds=2 ** job.attempt)
            self.queue.enqueue(job)
        else:
            job.status = JobStatus.DEAD_LETTER
        
        return True
    
    def get_queue_health(self) -> Dict[str, Any]:
        """Get comprehensive queue health snapshot."""
        stats = self.queue.get_stats()
        return {
            "total_jobs": stats.total_jobs,
            "pending": stats.pending_jobs,
            "executing": stats.executing_jobs,
            "completed": stats.completed_jobs,
            "failed": stats.failed_jobs,
            "dead_letter": stats.dead_letter_jobs,
            "avg_execution_time_ms": stats.avg_execution_time_ms,
            "oldest_pending_age_ms": stats.oldest_pending_job_age_ms,
        }


# Global queue manager instance
_global_queue_manager: Optional[QueueManager] = None


def get_queue_manager() -> QueueManager:
    """Get or create global queue manager."""
    global _global_queue_manager
    if _global_queue_manager is None:
        _global_queue_manager = QueueManager()
    return _global_queue_manager
