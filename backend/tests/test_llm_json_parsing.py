from src.services.llm_service import LLMService


def test_parse_plain_json_object():
    payload, diag = LLMService.parse_json_payload_with_diagnostics('{"summary":"ok"}')
    assert payload == {"summary": "ok"}
    assert diag is None


def test_parse_fenced_json_object():
    text = "```json\n{\"summary\":\"ok\"}\n```"
    payload, diag = LLMService.parse_json_payload_with_diagnostics(text)
    assert payload == {"summary": "ok"}
    assert diag is None


def test_parse_trailing_comma_repair():
    text = "```json\n{\"summary\":\"ok\",}\n```"
    payload, diag = LLMService.parse_json_payload_with_diagnostics(text)
    assert payload == {"summary": "ok"}
    assert diag is not None
    assert diag.get("parser_stage") == "repair"


def test_parse_truncated_json_reports_diagnostics():
    text = '{"summary":"ok","items":[1,2'
    payload, diag = LLMService.parse_json_payload_with_diagnostics(text)
    assert payload is None
    assert diag is not None
    assert diag.get("parser_stage") == "json_decode"
    assert "issue" in diag


def test_truncated_json_flags_truncation_and_retry_guidance():
    payload, diag = LLMService.parse_json_payload_with_diagnostics('{"summary":"ok","items":[1,2')
    assert payload is None
    assert diag["truncated"] is True
    assert "token" in diag["retry_guidance"].lower()


def test_non_json_output_is_not_reported_as_truncated():
    payload, diag = LLMService.parse_json_payload_with_diagnostics("I cannot help with that request.")
    assert payload is None
    assert diag["truncated"] is False
    assert diag["retry_guidance"]


def test_empty_response_reports_guidance():
    payload, diag = LLMService.parse_json_payload_with_diagnostics("")
    assert payload is None
    assert diag["parser_stage"] == "input"
    assert diag["retry_guidance"]


def test_json_output_instruction_forbids_fences():
    instruction = LLMService.JSON_OUTPUT_INSTRUCTION.lower()
    assert "markdown code fences" in instruction
    assert "only a valid json object" in instruction
