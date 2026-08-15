from src.prompts.requirement_categorization_v2 import PROMPT_VERSION as CATEGORIZATION_PROMPT_VERSION, build_prompt as build_categorization_prompt
from src.prompts.test_cases_v2 import PROMPT_VERSION as TEST_CASES_PROMPT_VERSION, build_prompt as build_test_cases_prompt
from src.prompts.understanding_v3 import PROMPT_VERSION as UNDERSTANDING_PROMPT_VERSION, build_prompt as build_understanding_prompt
from src.services.llm_service import LLMService
from src.config import config


def test_understanding_escalation_uses_next_key_before_pro_tier(monkeypatch) -> None:
    service = LLMService()
    calls = []

    monkeypatch.setattr(service, "list_gemini_candidates", lambda key: ["gemini-flash", "gemini-pro"])

    def fake_call(model, key, prompt, policy=None):
        calls.append((model, key, policy.max_output_tokens))
        return "{\"summary\": \"ok\"}" if model == "gemini-pro" and key == "good-key" else None

    monkeypatch.setattr(service, "_call_gemini_model", fake_call)
    text, _ = service.generate_with_gemini("__routing_test__", ["bad-key", "good-key"], profile="understanding")

    assert text == '{"summary": "ok"}'
    assert calls == [
        ("gemini-flash", "bad-key", 4000),
        ("gemini-flash", "good-key", 4000),
        ("gemini-pro", "good-key", 4000),
    ]
    assert service.last_generation["tier"] == "pro"
    assert service.last_generation["key_index"] == 0


def test_gpt_failure_falls_back_to_gemini(monkeypatch) -> None:
    service = LLMService()
    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gpt")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: [f"{provider}-key"])
    monkeypatch.setattr(service, "_generate_with_gpt", lambda prompt, key, policy=None: None)

    def fake_gemini(prompt, keys, profile="default"):
        service.last_generation = {"provider": "gemini", "model": "gemini-flash", "fallback_used": True}
        return '{"ok": true}', []

    monkeypatch.setattr(service, "generate_with_gemini", fake_gemini)

    assert service.generate_text("__routing_test__", profile="test_cases") == '{"ok": true}'
    assert service.last_generation["provider"] == "gemini"
    assert service.last_generation["fallback_used"] is True


def test_versioned_prompts_include_json_contract_and_evidence_rules() -> None:
    instruction = "Respond with ONLY a valid JSON object."
    understanding = build_understanding_prompt(["requirements.md"], "src/App.tsx", instruction)
    categorization = build_categorization_prompt("summary", "architecture", ["Login"], ["Gap"], instruction)
    test_cases = build_test_cases_prompt("Application evidence", {"summary": "summary"}, instruction)

    assert UNDERSTANDING_PROMPT_VERSION.startswith("understanding-v3")
    assert CATEGORIZATION_PROMPT_VERSION.startswith("requirement-categorization-v2")
    assert TEST_CASES_PROMPT_VERSION.startswith("test-cases-v2")
    assert "Do not invent" in understanding
    assert "source evidence" in categorization
    assert "Every case must map" in test_cases
    assert instruction in understanding and instruction in categorization and instruction in test_cases
