# Feature 03: Data Generation Agent — AI Mode & Upload Mode

## 1. Overview

The Data Generation Agent is the **third stage** in the QET pipeline. It produces realistic synthetic test data for each selected test case. Data is context-aware: Positive cases get valid inputs, Negative cases get invalid/malformed inputs, Boundary cases get edge values.

**Two modes are available**:
- **AI Generate Mode** (default): AI generates per-case data automatically
- **Upload Mode**: User provides their own CSV/JSON; system maps and validates it against test cases

**No generic data, no static stubs.** All AI-generated data must be contextually derived from the specific test case's requirements.

---

## 2. Data Generation Matrix

| Test Case Type | Data Characteristics | Example |
| :--- | :--- | :--- |
| **Positive** | Valid format, realistic values, compliant with all constraints | `username: "valid.user@cfa.com"`, SSN: `"123-45-6789"` |
| **Negative** | Intentionally invalid to trigger rejections | `username: "not-an-email"`, password: `"abc"` (too short) |
| **Boundary** | Exact limit values | `income: 0.01`, `name: "A" × 50` (max chars) |
| **Validation** | Empty, null, or whitespace inputs | `username: ""`, `document_file: null` |
| **Error Handling** | Values that simulate system errors | `token: "EXPIRED_TOKEN_XYZ"`, `file_type: ".exe"` |

---

## 3. User Stories

### AI Generate Mode
- **US-1**: As a QA engineer, I click `[Generate Data with AI]` and the agent produces per-case synthetic records for all selected test cases.
- **US-2**: As a QA engineer, I can see the generated data for each test case in an expandable inline table.
- **US-3**: As a QA engineer, I can regenerate data for a single test case by clicking `[Regenerate Data]` on its row.
- **US-4**: As a QA engineer, the generated data schema is displayed with field names, types, and validation rules.

### Upload Mode
- **US-5**: As a QA engineer, I can switch to Upload Mode and upload my own CSV or JSON file.
- **US-6**: As a QA engineer, the system automatically maps uploaded records to test cases using `test_case_id` column/field.
- **US-7**: As a QA engineer, I see a validation report showing which test cases have data mapped and which are missing.
- **US-8**: As a QA engineer, unmapped test cases are highlighted and I can manually assign records to them.

---

## 4. Workspace UI Design

```
┌─ Data Generation ───────────────────────────────────────────────────────┐
│                                                                         │
│  Mode: [🤖 AI Generate ●] [📂 Upload Your Own ○]                        │
│                                                                         │
│  ── AI Generate Mode ──────────────────────────────────────────────     │
│                                                                         │
│  Generating synthetic data for 12 selected test cases...               │
│  [████████████░░░░] 8/12 complete                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TC-POS-001 ✅  [View Data ▼]  [Regenerate]                       │  │
│  │  username: "candidate.test@cfa.com"                              │  │
│  │  password: "ValidPass@2024"                                      │  │
│  │  income: 75000.00   ssn: "123-45-6789"   terms: true            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ TC-NEG-002 ✅  [View Data ▼]  [Regenerate]                       │  │
│  │  username: "bad-email-format"                                    │  │
│  │  password: "abc"   (too short — triggers validation error)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Bottom CTA ────────────────────────────────────────────────────┐   │
│  │  ✅ Data ready for 12 cases   [Proceed to Test Script Agent →]   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: AI Generate Mode
- AI generates a dedicated data record for each selected test case.
- The prompt includes: test case category, feature area, expected outcome, preconditions, and the application's domain.
- Generated fields must match the application's actual input schema (derived from codebase analysis in sub-agent 1b).
- Records are saved to `uploads/{run_id}/artifacts/synthetic_dataset.json`.
- A schema definition is also saved to `uploads/{run_id}/artifacts/data_schema.json`.

### FR-2: Per-Case Regeneration
- Each test case row has a `[Regenerate Data]` button.
- Clicking regenerates only that case's record without affecting others.
- Regeneration is non-destructive — replaces the old record for that case_id only.

### FR-3: Upload Mode
- Accepts `.csv` or `.json` file.
- **JSON format expected**: `{ "records": [{ "test_case_id": "TC-POS-001", ... }] }`
- **CSV format**: First column must be `test_case_id`, remaining columns are data fields.
- After upload, system validates:
  - Which `test_case_id` values match selected test cases
  - Which test cases have no matching record (flagged as "unmapped")
  - Schema consistency across records

### FR-4: Upload Validation Report
- Show mapping result table:
  - ✅ `TC-POS-001` → mapped (record ID `REC-001`)
  - ⚠️ `TC-BND-003` → unmapped (no record found for this case ID)
  - ❌ `TC-VAL-004` → invalid record (missing required field `username`)
- Allow user to download a mapping template CSV.

### FR-5: Completion Gate
- Proceed CTA is active only when ALL selected test cases have data records (either AI-generated or uploaded-and-mapped).
- Partial data (some cases unmapped) shows a warning and requires user to either generate missing ones or deselect unmapped cases.

---

## 6. Artifacts Saved

| Artifact | Format | Path |
| :--- | :--- | :--- |
| Full dataset | JSON | `uploads/{run_id}/artifacts/synthetic_dataset.json` |
| Schema definition | JSON | `uploads/{run_id}/artifacts/data_schema.json` |
| CSV export | CSV | `uploads/{run_id}/artifacts/synthetic_dataset.csv` |
| Upload mapping report | JSON | `uploads/{run_id}/artifacts/data_mapping_report.json` (Upload Mode only) |

---

## 7. Backend API Contracts

```
POST /api/v1/runs/{run_id}/generate-data
  Body: { case_ids: string[], mode: "ai" }
  Response: SSE stream → { event: "case_progress", data: { case_id, record } }

POST /api/v1/runs/{run_id}/upload-data
  Body: multipart/form-data  (field: file)
  Response: { mapping_report: DataMappingReport }

POST /api/v1/runs/{run_id}/generate-data/{case_id}/retry
  Response: { record: SyntheticRecord }

GET /api/v1/runs/{run_id}/data
  Response: { dataset: SyntheticDataset }
```

---

## 8. Acceptance Criteria
- [ ] AI mode generates contextually correct data for all 5 case types.
- [ ] Positive cases produce valid data; Negative cases produce intentionally invalid data.
- [ ] Per-case regeneration replaces only that case's record.
- [ ] Upload mode correctly parses CSV and JSON.
- [ ] Mapping validation report shows ✅ / ⚠️ / ❌ for each test case.
- [ ] Proceed CTA is blocked when any selected case lacks a data record.
- [ ] All data artifacts saved to correct paths.
- [ ] No hardcoded field names (schema derived from codebase analysis).
