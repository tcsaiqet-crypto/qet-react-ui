"""Prompt contract for traceable test-case generation."""

PROMPT_VERSION = "test-cases-v2-traceable"


def build_prompt(context_label: str, context: object, json_instruction: str) -> str:
    return (
        "Return a strict JSON object with key test_cases containing 10 to 14 items. Generate Positive, Negative, "
        "Boundary, Validation, and Error-Handling scenarios. Each item requires case_id, title, case_type, "
        "feature_area, requirement_id, description, priority, risk_level, automation_candidate, preconditions, steps, "
        "expected_result, evidence_source, confidence, review_status, synthetic_data_keys. Use IDs such as TC-POS-001. "
        "Every case must map to supplied requirement evidence or an explicit supplied gap. Expected results must be "
        "observable. Set automation_candidate false when stable automation evidence is unavailable. Include synthetic "
        "data keys only when the scenario consumes that data. Prioritize critical and high-risk coverage if output space "
        "is constrained.\n"
        f"{context_label}: {context}\n"
        f"{json_instruction}"
    )
