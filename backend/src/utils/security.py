"""Security & Safe ZIP Extraction Utilities."""

import os
import re
import zipfile
from pathlib import Path
from typing import List, Optional, Set, Tuple
from src.config import config
from src.models.schemas import FileMetadata


class SecurityError(ValueError):
    """Custom exception raised when security validation fails."""
    pass


def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    """Validate that target_path is within base_dir (Zip Slip protection)."""
    resolved_base = base_dir.resolve()
    resolved_target = target_path.resolve()
    try:
        resolved_target.relative_to(resolved_base)
        return True
    except ValueError:
        return False


def is_junk_member(filename: str) -> bool:
    """True if any path segment matches a known dependency/build/VCS noise folder."""
    normalized = filename.replace("\\", "/").lower()
    parts = set(normalized.split("/"))
    return bool(parts & config.junk_dir_patterns)


def is_excluded_member(filename: str) -> bool:
    """True if the file should be ignored for safe analysis intake instead of extracted."""
    normalized = filename.replace("\\", "/").lower()
    basename = normalized.rsplit("/", 1)[-1]
    ext = ("." + basename.rsplit(".", 1)[-1].lower()) if "." in basename else ""
    return is_junk_member(filename) or ext in config.forbidden_extensions


def validate_and_extract_zip(zip_path: Path, target_dir: Path, allowed_paths: Optional[Set[str]] = None) -> Tuple[List[FileMetadata], int, int, int]:
    """
    Safely extract ZIP archive, skipping noisy dependency/build/VCS folders and
    executable helpers while enforcing size limits and path traversal checks.
    
    Returns:
        Tuple[List[FileMetadata], total_file_count, total_bytes_extracted, excluded_count]
    """
    if not zip_path.exists():
        raise SecurityError(f"ZIP file does not exist at {zip_path}")
        
    if not zipfile.is_zipfile(zip_path):
        raise SecurityError(f"Provided file {zip_path.name} is not a valid ZIP archive")

    target_dir.mkdir(parents=True, exist_ok=True)
    
    extracted_files: List[FileMetadata] = []
    total_files = 0
    total_bytes = 0
    excluded_count = 0

    with zipfile.ZipFile(zip_path, 'r') as zf:
        infolist = zf.infolist()
        useful_members = []

        for member in infolist:
            # Ignore directory entries for size/limit checks
            if member.is_dir():
                continue

            # Skip noisy dependency/build/VCS folders and executable helpers entirely.
            if is_excluded_member(member.filename):
                excluded_count += 1
                continue

            # Respect pre-classified include list when provided by the ZIP processor.
            if allowed_paths is not None and member.filename not in allowed_paths:
                excluded_count += 1
                continue

            # Single file size check
            if member.file_size > config.max_single_file_bytes:
                raise SecurityError(
                    f"File {member.filename} size ({member.file_size} bytes) exceeds limit of {config.max_single_file_bytes} bytes"
                )

            ext = Path(member.filename).suffix.lower()

            total_files += 1
            total_bytes += member.file_size

            # Cumulative total bytes check
            if total_bytes > config.max_zip_total_bytes:
                raise SecurityError(
                    f"Total uncompressed ZIP size exceeds maximum limit of {config.max_zip_total_bytes} bytes"
                )

            # Zip Slip path traversal check
            dest_path = target_dir / member.filename
            if not is_safe_path(target_dir, dest_path):
                raise SecurityError(
                    f"Potential Zip Slip path traversal detected: '{member.filename}'"
                )

            useful_members.append(member)

        # File count limit is applied after excluding junk/unsafe files.
        if total_files > config.max_zip_file_count:
            raise SecurityError(
                f"ZIP contains {total_files} useful files, exceeding maximum limit of {config.max_zip_file_count}"
            )

        # Extraction loop after passing all validations.
        for member in useful_members:
            dest_path = target_dir / member.filename
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            with zf.open(member) as source, open(dest_path, "wb") as target:
                target.write(source.read())

            ext = dest_path.suffix.lower()
            extracted_files.append(
                FileMetadata(
                    rel_path=member.filename,
                    size_bytes=dest_path.stat().st_size,
                    extension=ext,
                    is_binary=ext in {".png", ".jpg", ".jpeg", ".pdf", ".zip", ".ico", ".woff", ".ttf"}
                )
            )

    return extracted_files, total_files, total_bytes, excluded_count


def sanitize_log_message(msg: str) -> str:
    """Mask credentials and sensitive strings in log messages."""
    # Mask common key-value pattern secrets (tokens, API keys, passwords)
    patterns = [
        (r'(?i)(api[_-]?key|password|secret|token|bearer)\s*[:=]\s*["\']?([^"\'\s]+)["\']?', r'\1=***REDACTED***'),
        (r'sk-[a-zA-Z0-9]{32,}', 'sk-***REDACTED***')
    ]
    sanitized = msg
    for pattern, replacement in patterns:
        sanitized = re.sub(pattern, replacement, sanitized)
    return sanitized
