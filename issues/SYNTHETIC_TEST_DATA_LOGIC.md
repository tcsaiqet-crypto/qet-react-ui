# Synthetic Test Data Generation Logic Specification

## 1. Principle: AI-Grounded, Contextual & Non-Generic

No hardcoded stubs or fake placeholders are permitted. The `TestDataAgent` builds realistic test data dynamically tailored to each test case category.

---

## 2. Test Case Category to Data Matrix

| Category | Objective | Data Characteristics |
| :--- | :--- | :--- |
| **Positive** | Verify happy path flows | Valid email format, complex compliant password, realistic names, valid SSN, standard income numbers. |
| **Negative** | Verify validation rejections | Invalid email format (`user@bad`), incorrect passwords, malformed SSN (`000-00-0000`), mismatched types. |
| **Boundary** | Test limits & constraints | Minimum income limit ($0.01), Maximum loan amount ($1,000,000), exact character length boundary (e.g. 50 char name). |
| **Validation** | Verify required field errors | Empty strings (`""`), null values, whitespace-only fields, unsupported file extensions (`.exe`, `.xyz`). |
| **Error Handling** | Test system recovery | Simulated timeouts, invalid tokens, mock unauthorized sessions. |

---

## 3. Data-to-Script Binding Architecture

Each test script imports or references its exact record from the synthetic dataset:

```python
# In test_TC_POS_001.py:
from test_data import get_test_record

record = get_test_record("TC-POS-001")
# record = {
#     "username": "candidate.cfa.test@domain.com",
#     "password": "CompliantPassword123!",
#     "income": 75000.00
# }
```

---

## 4. UI Data Inspector
- Accessible per test case via `[📊 View Data]` button.
- Displays full JSON structure, validation flags, and schema compliance badge.
