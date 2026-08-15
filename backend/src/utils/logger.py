"""Structured Logging Utility."""

import logging
import sys
import contextvars
from typing import Optional
from contextlib import contextmanager
from pathlib import Path
from src.utils.security import sanitize_log_message

# Context variable to hold the current run ID
current_run_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_run_id", default=None)


@contextmanager
def log_run_context(run_id: str):
    """Context manager to scope logs to a specific run ID."""
    token = current_run_id.set(run_id)
    try:
        yield
    finally:
        current_run_id.reset(token)


class SanitizedFormatter(logging.Formatter):
    """Formatter that sanitizes secrets before emitting logs."""
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = sanitize_log_message(original)
        encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
        try:
            sanitized.encode(encoding)
            return sanitized
        except (UnicodeEncodeError, AttributeError):
            return sanitized.encode(encoding, errors="replace").decode(encoding)


class RunFileHandler(logging.Handler):
    """Logging handler that dynamically directs logs to temp/run_{run_id}.log."""
    def emit(self, record: logging.LogRecord) -> None:
        run_id = current_run_id.get()
        if not run_id:
            return
        try:
            # We are running with CWD inside 'backend', so 'temp' is backend/temp
            temp_dir = Path("temp")
            temp_dir.mkdir(parents=True, exist_ok=True)
            log_file = temp_dir / f"run_{run_id}.log"
            
            msg = self.format(record)
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(msg + "\n")
        except Exception:
            self.handleError(record)


def get_logger(name: str = "qet_accelerator") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Stream Handler for console stdout
        handler = logging.StreamHandler(sys.stdout)
        formatter = SanitizedFormatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # File Handler for writing run-specific log files
        file_handler = RunFileHandler()
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
    return logger


logger = get_logger()

