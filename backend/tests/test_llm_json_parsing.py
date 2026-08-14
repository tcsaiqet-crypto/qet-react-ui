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
