"""ZIP intake classifier that decides which files are useful before extraction."""

import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Set

from schemas.contracts import ZipFileDecision, ZipProcessingSummary
from src.config import config
from src.services.llm_service import LLMService


KNOWN_SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".kt", ".cs", ".go", ".rb",
    ".php", ".scala", ".rs", ".cpp", ".c", ".h", ".hpp", ".swift", ".sql",
    ".html", ".css", ".scss", ".sass", ".less", ".vue", ".svelte", ".json", ".yaml", ".yml", ".xml",
}
KNOWN_DOC_EXTENSIONS = {".md", ".txt", ".pdf", ".doc", ".docx", ".rst", ".adoc"}
KNOWN_CONFIG_FILENAMES = {"dockerfile", "makefile", "jenkinsfile", "procfile"}
TEXT_LIKE_EXTENSIONS = KNOWN_SOURCE_EXTENSIONS | KNOWN_DOC_EXTENSIONS | {".env", ".ini", ".cfg", ".toml"}


class ZipProcessingProgram:
    """Classify zip members into include/exclude buckets with optional AI review for unknown types."""

    def __init__(self) -> None:
        self.llm = LLMService()

    @staticmethod
    def _is_junk_member(filename: str) -> bool:
        parts = {part.lower() for part in Path(filename).parts}
        return bool(parts & config.junk_dir_patterns)

    @staticmethod
    def _is_forbidden_extension(ext: str) -> bool:
        return ext in config.forbidden_extensions

    @staticmethod
    def _is_known_useful(path: Path) -> bool:
        suffix = path.suffix.lower()
        return suffix in KNOWN_SOURCE_EXTENSIONS or suffix in KNOWN_DOC_EXTENSIONS or path.name.lower() in KNOWN_CONFIG_FILENAMES

    @staticmethod
    def _fallback_unknown_decision(path: Path) -> Dict[str, str]:
        if path.suffix.lower() in TEXT_LIKE_EXTENSIONS:
            return {"decision": "include", "reason": "text_like_unknown_extension", "source": "heuristic"}
        return {"decision": "exclude", "reason": "unknown_non_text_extension", "source": "heuristic"}

    def _ai_unknown_decision(self, rel_path: str, ext: str, size_bytes: int) -> Dict[str, str]:
        prompt = (
            "Return strict JSON only with keys decision and reason. "
            "decision must be include or exclude. "
            "You are classifying whether a file is useful for understanding a software codebase and deriving tests. "
            "Include files that likely contain business rules, source code, configuration, API contracts, templates, test assets, or requirement content. "
            "Exclude files that are binary assets, compiled outputs, dependency artifacts, local launch helpers, or unrelated machine-generated blobs.\n"
            f"Path: {rel_path}\n"
            f"Extension: {ext or '<none>'}\n"
            f"Size bytes: {size_bytes}\n"
        )
        text = self.llm.generate_text(prompt)
        data = self.llm.parse_json_payload(text)
        if isinstance(data, dict) and str(data.get("decision", "")).strip().lower() in {"include", "exclude"}:
            return {
                "decision": str(data.get("decision")).strip().lower(),
                "reason": str(data.get("reason", "ai_unknown_type_review")).strip() or "ai_unknown_type_review",
                "source": "ai",
            }
        return self._fallback_unknown_decision(Path(rel_path))

    def process_zip(self, zip_path: Path) -> Dict[str, object]:
        summary = ZipProcessingSummary(current_step="enumerating")
        included_paths: Set[str] = set()

        with zipfile.ZipFile(zip_path, "r") as zf:
            members = [member for member in zf.infolist() if not member.is_dir()]
            summary.total_members = len(members)
            summary.current_step = "classifying"

            for member in members:
                member_path = Path(member.filename)
                ext = member_path.suffix.lower()

                if self._is_junk_member(member.filename):
                    summary.decisions.append(
                        ZipFileDecision(
                            rel_path=member.filename,
                            extension=ext,
                            size_bytes=member.file_size,
                            decision="exclude",
                            reason="junk_directory",
                            source="rule",
                        )
                    )
                    summary.excluded_count += 1
                    continue

                if self._is_forbidden_extension(ext):
                    summary.decisions.append(
                        ZipFileDecision(
                            rel_path=member.filename,
                            extension=ext,
                            size_bytes=member.file_size,
                            decision="exclude",
                            reason="unsafe_executable_helper",
                            source="rule",
                        )
                    )
                    summary.excluded_count += 1
                    continue

                if self._is_known_useful(member_path):
                    summary.decisions.append(
                        ZipFileDecision(
                            rel_path=member.filename,
                            extension=ext,
                            size_bytes=member.file_size,
                            decision="include",
                            reason="known_useful_file_type",
                            source="rule",
                        )
                    )
                    summary.included_count += 1
                    included_paths.add(member.filename)
                    continue

                ai_or_fallback = self._ai_unknown_decision(member.filename, ext, member.file_size)
                if ai_or_fallback["source"] == "ai":
                    summary.reviewed_by_ai_count += 1
                if ai_or_fallback["decision"] == "include":
                    summary.included_count += 1
                    included_paths.add(member.filename)
                else:
                    summary.excluded_count += 1
                summary.decisions.append(
                    ZipFileDecision(
                        rel_path=member.filename,
                        extension=ext,
                        size_bytes=member.file_size,
                        decision=ai_or_fallback["decision"],
                        reason=ai_or_fallback["reason"],
                        source=ai_or_fallback["source"],
                    )
                )

        summary.current_step = "ready_for_extraction"
        return {
            "summary": summary.model_dump(),
            "included_paths": sorted(included_paths),
        }
