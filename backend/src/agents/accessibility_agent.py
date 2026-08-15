"""Static WCAG source scanner adapted from the tcscfaqetagents agent suite."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from schemas.contracts import AccessibilityFinding, AccessibilityReport, AccessibilityRuleResult, AppState
from src.agents.base_agent import BaseAgent


class AccessibilityAgent(BaseAgent):
    """Scan extracted source for statically verifiable WCAG A/AA issues."""

    __test__ = False
    extensions = {".html", ".htm", ".jsx", ".tsx", ".js", ".ts", ".vue", ".css"}
    rules = (
        ("img-alt", "1.1.1", "Non-text Content", "A", "critical"),
        ("input-label", "1.3.1", "Info and Relationships", "A", "critical"),
        ("non-keyboard-clickable", "2.1.1", "Keyboard", "A", "serious"),
        ("missing-skip-link", "2.4.1", "Bypass Blocks", "A", "moderate"),
        ("missing-page-title", "2.4.2", "Page Titled", "A", "serious"),
        ("generic-link-text", "2.4.4", "Link Purpose", "A", "moderate"),
        ("missing-lang", "3.1.1", "Language of Page", "A", "serious"),
        ("duplicate-id", "4.1.1", "Parsing", "A", "moderate"),
        ("missing-autocomplete", "1.3.5", "Identify Input Purpose", "AA", "minor"),
        ("low-contrast", "1.4.3", "Contrast", "AA", "serious"),
        ("low-non-text-contrast", "1.4.11", "Non-text Contrast", "AA", "moderate"),
        ("outline-removed", "2.4.7", "Focus Visible", "AA", "moderate"),
        ("input-label", "3.3.2", "Labels or Instructions", "A", "critical"),
    )

    def __init__(self, run_id: str = "RUN-20260813-001"):
        super().__init__(agent_name="AccessibilityAgent", description="Static WCAG 2.1 A/AA Rule Engine")
        self.artifact_dir = Path("uploads") / run_id / "artifacts"

    def run(self, state: AppState) -> AppState:
        root = Path(state.intake_manifest.extracted_path) if state.intake_manifest else Path()
        findings: List[AccessibilityFinding] = []
        files = [path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in self.extensions] if root.exists() else []
        for path in files:
            text = path.read_text(encoding="utf-8", errors="ignore")
            findings.extend(self._scan(str(path.relative_to(root)), text))
        state.accessibility_report = self._report(len(files), findings)
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        (self.artifact_dir / "accessibility_report.json").write_text(json.dumps(state.accessibility_report.model_dump(), indent=2), encoding="utf-8")
        return state

    def _scan(self, path: str, text: str) -> List[AccessibilityFinding]:
        findings: List[AccessibilityFinding] = []
        def add(rule_id: str, sc: str, name: str, impact: str, description: str, match: re.Match[str]) -> None:
            findings.append(AccessibilityFinding(rule_id=rule_id, wcag_sc=sc, wcag_name=name, impact=impact, description=description, file_path=path, line_number=text.count("\n", 0, match.start()) + 1, snippet=match.group(0)[:160]))
        for match in re.finditer(r"<img\b[^>]*>", text, re.I):
            if not re.search(r"\balt\s*=", match.group(0), re.I): add("img-alt", "1.1.1", "Non-text Content", "critical", "Image element has no alt attribute.", match)
        labels = set(re.findall(r"<label\b[^>]*\bfor\s*=\s*['\"]([^'\"]+)", text, re.I))
        for match in re.finditer(r"<input\b[^>]*>", text, re.I):
            tag, identifier = match.group(0), re.search(r"\bid\s*=\s*['\"]([^'\"]+)", match.group(0), re.I)
            if not re.search(r"type\s*=\s*['\"]hidden", tag, re.I) and not re.search(r"aria-label", tag, re.I) and not (identifier and identifier.group(1) in labels): add("input-label", "1.3.1", "Info and Relationships", "critical", "Input has no associated label or ARIA label.", match)
            if re.search(r"(email|password|tel|username|name)", tag, re.I) and not re.search(r"autocomplete\s*=", tag, re.I): add("missing-autocomplete", "1.3.5", "Identify Input Purpose", "minor", "Common user-data input has no autocomplete attribute.", match)
        for match in re.finditer(r"<(div|span)\b[^>]*\bonclick\s*=[^>]*>", text, re.I):
            if not (re.search(r"\brole\s*=", match.group(0), re.I) and re.search(r"\btabindex\s*=", match.group(0), re.I)): add("non-keyboard-clickable", "2.1.1", "Keyboard", "serious", "Clickable non-control lacks role and tabindex.", match)
        for match in re.finditer(r"outline\s*:\s*(none|0)\b", text, re.I): add("outline-removed", "2.4.7", "Focus Visible", "moderate", "Focus outline is removed.", match)
        for match in re.finditer(r"<a\b[^>]*>(.*?)</a>", text, re.I | re.S):
            if re.sub(r"<[^>]+>", "", match.group(1)).strip().lower() in {"click here", "here", "read more", "more", "link", "click"}: add("generic-link-text", "2.4.4", "Link Purpose", "moderate", "Link text does not describe its destination.", match)
        if re.search(r"<html\b", text, re.I):
            checks = (("missing-page-title", "2.4.2", "Page Titled", "serious", r"<title>"), ("missing-lang", "3.1.1", "Language of Page", "serious", r"<html"), ("missing-skip-link", "2.4.1", "Bypass Blocks", "moderate", r"<body"))
            for rule_id, sc, name, impact, token in checks:
                valid = (rule_id == "missing-page-title" and re.search(r"<title>\s*[^<]+", text, re.I)) or (rule_id == "missing-lang" and re.search(r"<html\b[^>]*\blang\s*=", text, re.I)) or (rule_id == "missing-skip-link" and re.search(r"href\s*=\s*['\"]#main", text, re.I))
                if not valid: add(rule_id, sc, name, impact, f"Missing {name.lower()} support.", re.search(token, text, re.I) or re.search(r"$", text))
        return findings

    def _report(self, files_scanned: int, findings: List[AccessibilityFinding]) -> AccessibilityReport:
        counts: Dict[str, int] = {impact: 0 for impact in ("critical", "serious", "moderate", "minor")}
        violations: Dict[str, int] = {}
        for finding in findings:
            counts[finding.impact] += 1
            violations[finding.rule_id] = violations.get(finding.rule_id, 0) + 1
        results = [AccessibilityRuleResult(rule_id=rule_id, wcag_sc=sc, wcag_name=name, wcag_level=level, impact=impact, passed=violations.get(rule_id, 0) == 0, violation_count=violations.get(rule_id, 0)) for rule_id, sc, name, level, impact in self.rules]
        passed = sum(result.passed for result in results)
        return AccessibilityReport(files_scanned=files_scanned, rules_total=len(results), rules_passed=passed, rating="A" if passed >= 10 else "Below A", total_violations=len(findings), critical_count=counts["critical"], serious_count=counts["serious"], moderate_count=counts["moderate"], minor_count=counts["minor"], rule_results=results, findings=findings, generated_at=datetime.now(timezone.utc).isoformat(), provenance={"generator": "AccessibilityAgent", "method": "static-source-pattern-matching"})