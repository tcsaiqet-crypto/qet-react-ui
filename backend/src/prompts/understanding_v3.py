"""Prompt contract for evidence-grounded application understanding."""

PROMPT_VERSION = "understanding-v3.1-evidence-grounded"


def build_prompt(doc_files: list[str], source_snapshot: str, json_instruction: str) -> str:
    return (
        "You are a QA automation architect analyzing an uploaded application. "
        "Use only the supplied requirement-document names and source snapshot as evidence. "
        "Do not invent routes, APIs, requirements, source files, or selectors. "
        "Prefer stable [data-testid] selectors; report another selector only when supported by source evidence. "
        "Return strict JSON with keys: summary (string), architecture_notes (string), "
        "testability_observations (string array max 4), entry_points (string array max 6), "
        "components (array max 6), flows (array max 4), gaps (array max 6), "
        "api_endpoints (array max 8), requirement_validation (array max 15). "
        "Each component needs component_id, name, type, file_path, description, selectors. "
        "Each flow needs flow_id, name, start_point, end_point, steps, description. "
        "Each gap needs gap_id, title, description, category, severity, evidence_source, confidence. "
        "Each api_endpoint needs endpoint_id, method, path, description, source_file. "
        "Each requirement_validation item needs item_id, item_name, "
        "status (Present, Partial, Missing, or Not Applicable), evidence_source, confidence, observations. "
        "Return an empty array when the evidence does not support entries for a key. "
        "When output space is limited, prioritize summary, components, flows, then gaps.\n"
        f"Requirement docs: {doc_files}\n"
        f"Source snapshot:\n{source_snapshot}\n"
        f"{json_instruction}"
    )
