# Contracts: Spec 025 — LangGraph State & Schema Interfaces

## 1. Graph State Model

```python
from typing import List, Dict, Any, Optional, TypedDict
from pydantic import BaseModel, Field

class BusinessRequirement(BaseModel):
    requirement_id: str = Field(description="Unique requirement identifier, e.g. BR-01")
    title: str = Field(description="Requirement title, e.g. Candidate Registration & Onboarding")
    category: str = Field(description="Functional category, e.g. Onboarding, KYC, Payment, Exam")
    description: str = Field(description="Full requirement specification")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Specific measurable criteria")

class AlignmentEvaluation(BaseModel):
    alignment_score: float = Field(ge=0.0, le=1.0, description="Fraction of test cases grounded in BRD (0.0 - 1.0)")
    passed: bool = Field(description="True if alignment_score >= 0.90 and zero framework leaks")
    framework_leaks_detected: List[str] = Field(default_factory=list, description="List of leaked technical terms (e.g. Streamlit, SQLite)")
    missing_requirement_ids: List[str] = Field(default_factory=list, description="Core BR-XX IDs unmapped in suite")
    feedback_for_generator: str = Field(default="", description="Targeted instructions to improve suite")

class QETGraphState(TypedDict):
    run_id: str
    uploaded_files: List[str]
    codebase_snapshot: str
    requirements: List[Dict[str, Any]]
    understanding_summary: str
    ui_components: List[Dict[str, Any]]
    test_cases: List[Dict[str, Any]]
    alignment_evaluation: Optional[Dict[str, Any]]
    critique_iteration: int
    synthetic_datasets: Dict[str, Any]
    playwright_scripts: List[Dict[str, Any]]
    execution_results: List[Dict[str, Any]]
    status: str
```

---

## 2. Test Case Schema Contract

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AlignedTestCase",
  "type": "object",
  "required": [
    "case_id",
    "title",
    "case_type",
    "requirement_id",
    "feature_area",
    "priority",
    "preconditions",
    "steps",
    "expected_result",
    "synthetic_data_keys"
  ],
  "properties": {
    "case_id": {
      "type": "string",
      "pattern": "^TC-(POS|NEG|BND|VAL|ERR)-[0-9]{3}$"
    },
    "title": { "type": "string" },
    "case_type": {
      "type": "string",
      "enum": ["Positive", "Negative", "Boundary", "Validation", "Error-Handling"]
    },
    "requirement_id": {
      "type": "string",
      "pattern": "^BR-[0-9]{2}$"
    },
    "feature_area": { "type": "string" },
    "priority": {
      "type": "string",
      "enum": ["Critical", "High", "Medium", "Low"]
    },
    "preconditions": { "type": "string" },
    "steps": {
      "type": "array",
      "items": { "type": "string" }
    },
    "expected_result": { "type": "string" },
    "synthetic_data_keys": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

---

## 3. Synthetic Test Data Schema (CFA Domain)

```json
{
  "TC-POS-001": {
    "persona": {
      "fullName": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "country": "India",
      "cfaLevel": "Level I",
      "education": "Bachelor of Commerce"
    },
    "kyc": {
      "documentType": "Passport",
      "documentNumber": "Z8194012",
      "expiryDate": "2031-10-15",
      "livenessVerified": true
    }
  },
  "TC-POS-002": {
    "enrollment": {
      "examWindow": "November 2026",
      "currency": "USD",
      "amount": 1200.00
    },
    "payment": {
      "cardNumber": "4000001234567890",
      "cardHolder": "Priya Sharma",
      "expiry": "12/28",
      "cvv": "789",
      "status": "APPROVED"
    }
  }
}
```
