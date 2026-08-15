"""Prompt contract for evidence-grounded requirement classification."""

PROMPT_VERSION = "requirement-categorization-v2-evidence-grounded"


def build_prompt(summary: str, architecture_notes: str, components: list[str], gaps: list[str], json_instruction: str) -> str:
    return (
        "You are a QA requirements analyst. Analyze only the supplied application evidence and output a structured "
        "requirement catalog in strict JSON format. Return JSON with key requirements, an array of objects. "
        "Each requirement object needs requirement_id, title, description, type, category_id, source_evidence. "
        "type must be exactly one of Functional, NonFunctional, Security, Performance, Accessibility, Reliability, "
        "Integration, Compliance, DataQuality, Usability. Do not create a requirement without source evidence from "
        "the supplied summary, architecture, component list, or gap list. Preserve concrete source evidence.\n"
        f"Summary: {summary}\nArchitecture: {architecture_notes}\nComponents: {components}\nGaps: {gaps}\n"
        f"{json_instruction}"
    )
