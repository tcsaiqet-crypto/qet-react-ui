"""ZIP intake classifier that decides which files are useful before extraction."""

import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Set

from schemas.contracts import ZipFileDecision, ZipProcessingSummary
from src.config import config
from src.services.llm_service import LLMService


KNOWN_SOURCE_EXTENSIONS = {
    ".py", ".pyi", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts",
    ".java", ".kt", ".kts", ".cs", ".go", ".rb", ".php", ".scala", ".rs",
    ".cpp", ".c", ".cc", ".cxx", ".h", ".hpp", ".hxx", ".swift", ".sql",
    ".html", ".htm", ".xhtml", ".css", ".scss", ".sass", ".less", ".vue", ".svelte",
    ".json", ".jsonc", ".json5", ".yaml", ".yml", ".xml", ".graphql", ".gql",
    ".proto", ".prisma", ".f90", ".f", ".pxd", ".pyx", ".sh", ".bash", ".zsh",
}
KNOWN_DOC_EXTENSIONS = {
    ".md", ".markdown", ".txt", ".pdf", ".doc", ".docx", ".rst", ".adoc",
    ".csv", ".tsv", ".log", ".rtf",
}
KNOWN_CONFIG_FILENAMES = {
    "dockerfile", "makefile", "jenkinsfile", "procfile", "gemfile", "vagrantfile",
    "cmakelists.txt", "readme", "license", "licence", "contributing", "changelog",
}
KNOWN_CONFIG_EXTENSIONS = {
    ".env", ".example", ".ini", ".cfg", ".conf", ".toml", ".properties",
    ".config", ".babelrc", ".eslintrc", ".prettierrc", ".editorconfig",
    ".lock", ".sum", ".tag",
}
KNOWN_ASSET_EXTENSIONS = {
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff",
    ".woff", ".woff2", ".ttf", ".eot", ".otf", ".mp3", ".mp4", ".wav", ".ogg",
    ".zip", ".tar", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".map", ".wasm",
    ".pyd", ".typed", ".lib", ".db", ".sqlite", ".sqlite3", ".bin", ".dat",
}
TEXT_LIKE_EXTENSIONS = KNOWN_SOURCE_EXTENSIONS | KNOWN_DOC_EXTENSIONS | KNOWN_CONFIG_EXTENSIONS

MAX_AI_REVIEWS_PER_ZIP = 5
MAX_EXCLUDED_DECISIONS_SAMPLE = 100


class ZipProcessingProgram:
    """Classify zip members into include/exclude buckets with optional AI review for unknown types."""

    def __init__(self) -> None:
        self.llm = LLMService()

    @staticmethod
    def _is_junk_member(filename: str) -> bool:
        normalized = filename.replace("\\", "/").lower()
        parts = set(normalized.split("/"))
        return bool(parts & config.junk_dir_patterns)

    @staticmethod
    def _is_forbidden_extension(ext: str) -> bool:
        return ext in config.forbidden_extensions

    @staticmethod
    def _is_known_useful(posix_name: str, ext: str) -> bool:
        basename = posix_name.rsplit("/", 1)[-1].lower()
        return (
            ext in KNOWN_SOURCE_EXTENSIONS
            or ext in KNOWN_DOC_EXTENSIONS
            or ext in KNOWN_CONFIG_EXTENSIONS
            or basename in KNOWN_CONFIG_FILENAMES
        )

    @staticmethod
    def _fallback_unknown_decision(ext: str) -> Dict[str, str]:
        if ext in TEXT_LIKE_EXTENSIONS:
            return {"decision": "include", "reason": "text_like_unknown_extension", "source": "heuristic"}
        if ext in KNOWN_ASSET_EXTENSIONS:
            return {"decision": "exclude", "reason": "binary_asset_excluded", "source": "heuristic"}
        return {"decision": "exclude", "reason": "unknown_non_text_extension", "source": "heuristic"}

    def _ai_unknown_decision(self, rel_path: str, ext: str, size_bytes: int) -> Dict[str, str]:
        if not self.llm.is_enabled():
            return self._fallback_unknown_decision(ext)

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
        try:
            text = self.llm.generate_text(prompt)
            data = self.llm.parse_json_payload(text)
            if isinstance(data, dict) and str(data.get("decision", "")).strip().lower() in {"include", "exclude"}:
                return {
                    "decision": str(data.get("decision")).strip().lower(),
                    "reason": str(data.get("reason", "ai_unknown_type_review")).strip() or "ai_unknown_type_review",
                    "source": "ai",
                }
        except Exception:
            pass
        return self._fallback_unknown_decision(ext)

    def process_zip(self, zip_path: Path) -> Dict[str, object]:
        summary = ZipProcessingSummary(current_step="enumerating")
        included_paths: Set[str] = set()
        decisions: List[ZipFileDecision] = []
        excluded_sampled = 0
        ai_reviews_count = 0

        with zipfile.ZipFile(zip_path, "r") as zf:
            members = [member for member in zf.infolist() if not member.is_dir()]
            summary.total_members = len(members)
            summary.current_step = "classifying"

            for member in members:
                raw_filename = member.filename
                posix_name = raw_filename.replace("\\", "/")
                basename = posix_name.rsplit("/", 1)[-1]
                ext = ("." + basename.rsplit(".", 1)[-1].lower()) if "." in basename else ""

                if self._is_junk_member(posix_name):
                    summary.excluded_count += 1
                    if excluded_sampled < MAX_EXCLUDED_DECISIONS_SAMPLE:
                        decisions.append(
                            ZipFileDecision(
                                rel_path=raw_filename,
                                extension=ext,
                                size_bytes=member.file_size,
                                decision="exclude",
                                reason="junk_directory",
                                source="rule",
                            )
                        )
                        excluded_sampled += 1
                    continue

                if self._is_forbidden_extension(ext):
                    summary.excluded_count += 1
                    if excluded_sampled < MAX_EXCLUDED_DECISIONS_SAMPLE:
                        decisions.append(
                            ZipFileDecision(
                                rel_path=raw_filename,
                                extension=ext,
                                size_bytes=member.file_size,
                                decision="exclude",
                                reason="unsafe_executable_helper",
                                source="rule",
                            )
                        )
                        excluded_sampled += 1
                    continue

                if self._is_known_useful(posix_name, ext):
                    summary.included_count += 1
                    included_paths.add(raw_filename)
                    decisions.append(
                        ZipFileDecision(
                            rel_path=raw_filename,
                            extension=ext,
                            size_bytes=member.file_size,
                            decision="include",
                            reason="known_useful_file_type",
                            source="rule",
                        )
                    )
                    continue

                # Unknown extension - check if asset or text-like first
                if ext in KNOWN_ASSET_EXTENSIONS:
                    summary.excluded_count += 1
                    if excluded_sampled < MAX_EXCLUDED_DECISIONS_SAMPLE:
                        decisions.append(
                            ZipFileDecision(
                                rel_path=raw_filename,
                                extension=ext,
                                size_bytes=member.file_size,
                                decision="exclude",
                                reason="binary_asset_excluded",
                                source="rule",
                            )
                        )
                        excluded_sampled += 1
                    continue

                # Run AI review for bounded number of unknown files
                if ai_reviews_count < MAX_AI_REVIEWS_PER_ZIP and self.llm.is_enabled():
                    ai_or_fallback = self._ai_unknown_decision(raw_filename, ext, member.file_size)
                    if ai_or_fallback["source"] == "ai":
                        ai_reviews_count += 1
                        summary.reviewed_by_ai_count += 1
                else:
                    ai_or_fallback = self._fallback_unknown_decision(ext)

                if ai_or_fallback["decision"] == "include":
                    summary.included_count += 1
                    included_paths.add(raw_filename)
                    decisions.append(
                        ZipFileDecision(
                            rel_path=raw_filename,
                            extension=ext,
                            size_bytes=member.file_size,
                            decision="include",
                            reason=ai_or_fallback["reason"],
                            source=ai_or_fallback["source"],
                        )
                    )
                else:
                    summary.excluded_count += 1
                    if excluded_sampled < MAX_EXCLUDED_DECISIONS_SAMPLE or ai_or_fallback["source"] == "ai":
                        decisions.append(
                            ZipFileDecision(
                                rel_path=raw_filename,
                                extension=ext,
                                size_bytes=member.file_size,
                                decision="exclude",
                                reason=ai_or_fallback["reason"],
                                source=ai_or_fallback["source"],
                            )
                        )
                        if ai_or_fallback["source"] != "ai":
                            excluded_sampled += 1

        summary.decisions = decisions
        summary.current_step = "ready_for_extraction"
        return {
            "summary": summary.model_dump(),
            "included_paths": sorted(included_paths),
        }
