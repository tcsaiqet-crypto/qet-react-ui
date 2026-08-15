from pathlib import Path

from schemas.contracts import AppState, IntakeManifest
from src.agents.accessibility_agent import AccessibilityAgent


def test_accessibility_agent_scans_extracted_source_and_writes_report(tmp_path: Path) -> None:
    source_root = tmp_path / "source"
    source_root.mkdir()
    (source_root / "index.html").write_text(
        "<html><body><img src='logo.png'><input type='email'><a href='/more'>Read more</a></body></html>",
        encoding="utf-8",
    )
    state = AppState(intake_manifest=IntakeManifest(
        upload_id="accessibility-test",
        zip_filename="source.zip",
        extracted_path=str(source_root),
        total_files=1,
        total_size_bytes=1,
        created_at="2026-08-15T00:00:00+00:00",
    ))
    agent = AccessibilityAgent(run_id="accessibility-test")
    agent.artifact_dir = tmp_path / "artifacts"

    updated = agent.run(state)

    assert updated.accessibility_report is not None
    assert updated.accessibility_report.files_scanned == 1
    assert updated.accessibility_report.total_violations > 0
    assert {finding.rule_id for finding in updated.accessibility_report.findings} >= {"img-alt", "input-label", "generic-link-text"}
    assert (agent.artifact_dir / "accessibility_report.json").exists()