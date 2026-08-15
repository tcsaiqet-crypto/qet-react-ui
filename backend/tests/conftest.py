import pytest
from src.services.llm_service import LLMService

# Store reference to original methods to allow selective delegation
original_generate_with_gemini = LLMService.generate_with_gemini
original_generate_with_gpt = LLMService._generate_with_gpt
original_generate_text = LLMService.generate_text

@pytest.fixture(autouse=True)
def mock_llm_service(monkeypatch):
    """Automatically mock LLMService methods globally during tests, delegating specific test cases."""
    def mock_generate_text(self, prompt: str, profile: str = "default"):
        if prompt.startswith("__routing_test__"):
            return original_generate_text(self, prompt, profile)
        prompt_lower = prompt.lower()
        if profile == "test_cases" or "test_cases" in prompt_lower or "test-cases" in prompt_lower or "case_id" in prompt_lower:
            return """{
  "test_cases": [
    {
      "case_id": "TC-POS-001",
      "title": "Positive Login Check",
      "case_type": "Positive",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify login succeeds with valid credentials",
      "priority": "High",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": ["System is online"],
      "steps": ["Enter username", "Enter password", "Click login"],
      "expected_result": "User is authenticated and redirected to dashboard",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["username", "password"]
    },
    {
      "case_id": "TC-POS-002",
      "title": "Positive Dashboard Navigation Check",
      "case_type": "Positive",
      "feature_area": "Dashboard",
      "requirement_id": "REQ-2",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify dashboard navigates properly",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": ["User is logged in"],
      "steps": ["Click profile link"],
      "expected_result": "Profile page displayed",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": []
    },
    {
      "case_id": "TC-NEG-001",
      "title": "Negative Login Check",
      "case_type": "Negative",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify login fails with invalid credentials",
      "priority": "High",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": ["System is online"],
      "steps": ["Enter invalid username", "Enter password", "Click login"],
      "expected_result": "Error message displayed",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["username", "password"]
    },
    {
      "case_id": "TC-NEG-002",
      "title": "Negative Input Check",
      "case_type": "Negative",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify login empty fields",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Click login"],
      "expected_result": "Fields validated",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": []
    },
    {
      "case_id": "TC-BND-001",
      "title": "Boundary Login Username Length",
      "case_type": "Boundary",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify username length boundaries",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Enter max length username"],
      "expected_result": "Username handled correctly",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["username"]
    },
    {
      "case_id": "TC-BND-002",
      "title": "Boundary Password Length",
      "case_type": "Boundary",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify password length boundaries",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Enter min length password"],
      "expected_result": "Password validated",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["password"]
    },
    {
      "case_id": "TC-VAL-001",
      "title": "Validation Username Special Chars",
      "case_type": "Validation",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify username invalid characters are rejected",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Enter special chars"],
      "expected_result": "Warning shown",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["username"]
    },
    {
      "case_id": "TC-VAL-002",
      "title": "Validation Email Format Check",
      "case_type": "Validation",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify username email formatting requirements",
      "priority": "Medium",
      "risk_level": "Low",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Enter malformed email"],
      "expected_result": "Format warning shown",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": ["username"]
    },
    {
      "case_id": "TC-ERR-001",
      "title": "Error-Handling Service Timeout Recovery",
      "case_type": "Error-Handling",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify client handles auth service timeout",
      "priority": "High",
      "risk_level": "Medium",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Mock service timeout", "Click login"],
      "expected_result": "Timeout notification shown, retry allowed",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": []
    },
    {
      "case_id": "TC-ERR-002",
      "title": "Error-Handling Network Disconnect Check",
      "case_type": "Error-Handling",
      "feature_area": "Auth",
      "requirement_id": "REQ-1",
      "requirement_category_id": "CAT-1",
      "requirement_type": "Functional",
      "description": "Verify network disconnect error state behavior",
      "priority": "High",
      "risk_level": "Medium",
      "automation_candidate": true,
      "preconditions": [],
      "steps": ["Disconnect network", "Click login"],
      "expected_result": "Network disconnect banner displayed",
      "evidence_source": "Heuristic",
      "confidence": "High",
      "review_status": "Approved",
      "synthetic_data_keys": []
    }
  ]
}"""
        
        # UnderstandingAgent fallback summary, architecture_notes, etc.
        return """{
  "summary": "Mock application summary for testing.",
  "architecture_notes": "Mock architecture notes for testing.",
  "testability_observations": ["Stable locators used"],
  "entry_points": ["/login"],
  "components": [
    {
      "component_id": "COMP-1",
      "name": "Login",
      "type": "Form",
      "file_path": "src/components/Login.tsx",
      "description": "Login form",
      "selectors": [{"key": "submit", "value": "submit-btn"}]
    }
  ],
  "flows": [
    {
      "flow_id": "FLOW-1",
      "name": "Auth Flow",
      "start_point": "/login",
      "end_point": "/dashboard",
      "steps": ["Submit login", "Redirect"],
      "description": "Authentication flow"
    }
  ],
  "gaps": [
    {
      "gap_id": "GAP-1",
      "title": "Missing validation",
      "description": "Missing client side validation",
      "category": "Validation",
      "severity": "Low",
      "evidence_source": "Requirements check",
      "confidence": "High"
    }
  ]
}"""

    def mock_generate_with_gemini(self, prompt: str, api_keys: str | list[str], profile: str = "default"):
        keys_list = [api_keys] if isinstance(api_keys, str) else list(api_keys)
        # If testing key fallback with dummy/test keys, execute the original logic
        if "good-key" in keys_list or "bad-key" in keys_list:
            return original_generate_with_gemini(self, prompt, api_keys, profile)
        return mock_generate_text(self, prompt), []

    def mock_generate_with_gpt(self, prompt: str, api_key: str, policy=None):
        if "good-key" in api_key or "bad-key" in api_key:
            return original_generate_with_gpt(self, prompt, api_key, policy)
        return mock_generate_text(self, prompt)

    monkeypatch.setattr(LLMService, "generate_text", mock_generate_text)
    monkeypatch.setattr(LLMService, "generate_with_gemini", mock_generate_with_gemini)
    monkeypatch.setattr(LLMService, "_generate_with_gpt", mock_generate_with_gpt)
