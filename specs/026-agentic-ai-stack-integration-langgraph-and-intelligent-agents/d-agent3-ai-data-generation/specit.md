# Specit D — Agent 3: AI-Powered Data Generation
## Feature: Domain-Specific Synthetic Test Data via AI

**Spec**: 026-D  
**Subfolder**: `d-agent3-ai-data-generation`  
**Priority**: 🟠 High  
**Depends On**: Specit A, Specit B, Specit C (final_test_suite exists in state)  
**Required By**: Specit E (scripts need data keys)  

---

## 1. What This Feature Is

Replace the current deterministic random-value `TestDataAgent` with three AI-powered subagents that generate **domain-specific, requirement-grounded synthetic test data** for every test case.

---

## 2. Current State vs Target

| Aspect | Current | Target |
| :--- | :--- | :--- |
| Schema | Generic: `username, password, ssn, income, employer` for ALL cases | Per-requirement schema: payment → card data; KYC → document data; registration → candidate profile |
| Values | Python `random.choice()` from hard-coded lists | AI-generated plausible domain values |
| Boundary data | Same structure, just different SSN format | AI generates true edge values per field type |
| PII safety | Hard-coded `is_synthetic=True` flag | AI instructed never to use real PII formats + flag enforced |

---

## 3. Subagent 3a — Schema Architect

### What It Does
For each `AlignedTestCase` in `state["final_test_suite"]`, AI designs a field schema specific to that test case's `requirement_id` and `feature_area`.

### Schema Examples by BR

| BR | Feature Area | AI-Designed Fields |
| :--- | :--- | :--- |
| BR-01 | Candidate Registration | `first_name, last_name, email, date_of_birth, nationality, cfa_level, education_degree, university` |
| BR-02 | Identity & KYC | `passport_number (fictional), passport_expiry, country_of_issue, selfie_quality_score, biometric_match_score` |
| BR-04 | Payment & Enrollment | `card_pan (test PAN), card_holder, expiry_mm_yy, cvv, billing_country, enrollment_fee_usd, payment_gateway_response` |
| BR-05 | AI Tutor | `study_topic, session_duration_min, questions_asked, tutor_score, learning_plan_id` |
| BR-08 | Proctoring | `exam_session_id, proctor_ai_score, flag_count, violation_type, environment_check_pass` |
| BR-10 | Score Reporting | `candidate_score, passing_score, score_percentile, score_band, score_release_date` |
| BR-12 | Digital Credential | `credential_id, issue_date, blockchain_hash, verification_url` |

### File: `backend/src/agents/data_schema_architect.py` (NEW)
```python
class DataSchemaArchitect:
    """Subagent 3a: Designs per-test-case data schemas."""

    def run(self, state: QETGraphState) -> dict:
        schemas = {}
        # Batch 5 test cases per AI call
        test_cases = state["final_test_suite"]
        batches = [test_cases[i:i+5] for i in range(0, len(test_cases), 5)]

        for batch in batches:
            chain = self.router.get_chain("schema_design", SCHEMA_ARCHITECT_PROMPT, DataSchemaBatch)
            result: DataSchemaBatch = chain.invoke({
                "test_cases": [tc.model_dump() for tc in batch]
            })
            for schema in result.schemas:
                schemas[schema.schema_id] = schema

        return {"data_schemas": schemas}
```

### Prompt
```
You are a test data schema designer for CFA Institute's digital candidate platform.

Design realistic synthetic data schemas for these {count} test cases.

Test Cases: {test_cases_json}

For each test case, create a DataSchema with fields specific to its requirement_id and feature_area.
Rules:
- Payment tests must include card_pan using test PAN ranges (4111..., 5500...)
- Identity tests must include fictional passport numbers (format: [A-Z]{2}\d{7})
- All fields must be synthetic — no real PII formats
- Boundary test cases should mark fields with is_boundary_sensitive=True
```

---

## 4. Subagent 3b — Data Populator

### What It Does
For each `DataSchema` from 3a, calls AI to generate the actual values. Groups 5 schemas per AI call.

### File: `backend/src/agents/test_data_agent.py` (UPDATE — replace `_build_record()`)
```python
def _generate_ai_record(self, schema: DataSchema, test_case: AlignedTestCase) -> SyntheticRecord:
    chain = self.router.get_chain("data_population", DATA_POPULATOR_PROMPT, SyntheticRecord)
    return chain.invoke({
        "schema": schema.model_dump(),
        "case_id": test_case.case_id,
        "case_type": test_case.case_type,
        "requirement_id": test_case.requirement_id,
        "expected_result": test_case.expected_result,
    })
```

### Prompt
```
You are generating synthetic test data for CFA Institute QA testing. 

Generate one realistic but entirely fictional data record for this test case.

Schema to populate: {schema_json}
Test Case: {case_id} ({case_type}) — Requirement: {requirement_id}
Expected Result: {expected_result}

Rules:
- Use ONLY fictional values — no real names, real card numbers, real passport IDs
- Negative test cases: generate values that should trigger rejection (expired card, wrong format SSN, failed biometric)
- Positive test cases: generate valid, plausible values that should pass all validations
- Set is_synthetic=True on the root record
- Email domains: @example.com or @test.cfa.local ONLY
```

---

## 5. Subagent 3c — Boundary Inflator

### What It Does
For `Boundary` and `Negative` test cases only, calls AI specifically to generate **extreme/edge values**.

### File: `backend/src/agents/boundary_inflator.py` (NEW)
```python
class BoundaryInflator:
    """Subagent 3c: Generates edge-case values for Boundary and Negative test cases."""

    def run(self, schemas: Dict[str, DataSchema], test_cases: List[AlignedTestCase]) -> Dict[str, SyntheticRecord]:
        boundary_cases = [tc for tc in test_cases if tc.case_type in ("Boundary", "Negative")]
        if not boundary_cases:
            return {}

        records = {}
        for tc in boundary_cases:
            schema = schemas[tc.case_id]
            chain = self.router.get_chain("boundary_inflation", BOUNDARY_PROMPT, SyntheticRecord)
            record = chain.invoke({
                "schema": schema.model_dump(),
                "case_type": tc.case_type,
                "expected_result": tc.expected_result,
            })
            records[tc.case_id] = record
        return records
```

### Boundary Examples by Case Type

| Case Type | Example Edge Values |
| :--- | :--- |
| Boundary — Income | `monthly_income: 0.01` (exactly at minimum) |
| Boundary — Name | `full_name: "A"` (1 char) or 255-char max-length string |
| Boundary — Expiry | `card_expiry: "2026-08-17"` (today, should fail tomorrow-check) |
| Boundary — Score | `candidate_score: 260` (exactly at passing threshold) |
| Negative — KYC | `passport_expiry: "2020-01-01"` (5 years expired) |
| Negative — Payment | `card_pan: "1234567890123456"` (Luhn-invalid) |
| Negative — Login | `password: "wrong"` (non-compliant, should fail auth) |

---

## 6. State Outputs

```python
# Added to QETGraphState after Agent 3 completes:
state["data_schemas"]      # Dict[case_id → DataSchema]
state["synthetic_records"] # List[SyntheticRecord] — one per test case
```

---

## 7. Integration with Playwright Scripts

Agent 4b (Script Synthesizer) reads `state["synthetic_records"]` and references fields by name:
```python
# In generated test script:
data = test_data["TC-POS-001"]
await page.fill("#card-number", data["card_pan"])
await page.fill("#card-expiry", data["expiry_mm_yy"])
```

This requires that `DataSchema.fields[n].field_name` exactly matches the fixture key used in the script — enforced by a post-generation validation step.

---

## 8. Acceptance Criteria

- [ ] `TC-POS-002` (BR-04 Payment) generates a record containing: `card_pan` (Luhn-valid test PAN), `card_holder`, `expiry_mm_yy`, `cvv`, `billing_country`
- [ ] `TC-NEG-001` (KYC — negative) generates an expired passport or invalid biometric score
- [ ] `TC-BND-001` generates boundary values (at-threshold, min-length, max-length)
- [ ] No record contains a real SSN format (999-xx-xxxx range is OK; 123-45-6789 style is not)
- [ ] All records have `is_synthetic: True`
- [ ] Email domains are only `@example.com` or `@test.cfa.local`
- [ ] `data_schemas` dict has one entry per test case in `final_test_suite`

---

## 9. Missing / Open Questions

- [ ] Should Subagent 3b also generate alt/variant records (e.g., 2-3 variants per Positive case for data-driven testing)?
- [ ] How do we handle test cases where no UI input is needed (e.g., a backend-only API validation test)?
- [ ] Who validates that `DataSchema.fields[n].field_name` matches what Agent 4b will use in the fixture?
