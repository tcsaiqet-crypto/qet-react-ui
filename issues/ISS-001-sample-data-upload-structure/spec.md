# ISS-001 · Spec — Sample Data Upload Structure

## User Story
> As a QA engineer, I want to quickly load the pre-built QET CFA Digital Journey sample requirements and codebase so I can demo the system without manually uploading files every session.

---

## Sample Data Inventory

### Requirement Documents (8 Files)
Located at: `d:\TcsQET\qet-react-ui\sample data upload\requirement\`

| File | Purpose | Maps To Test Context |
| --- | --- | --- |
| `agentspec.txt` | QET agent behavior specification | AI Agent test generation context |
| `analysis chatting with ai.txt` | Full AI conversation analysis | Requirement coverage baseline |
| `datamodel.txt` | Data model / entity relationship spec | Data integrity test cases |
| `designdoc.txt` | UI/UX design specification doc | UI component test coverage |
| `knowledgebase.txt` | Domain knowledge reference | Boundary & edge case definitions |
| `requirement1.txt` | Core CFA functional requirements | Positive & negative test case source |
| `sessionlog.txt` | Implementation session decisions | Architecture context |
| `uilabelling.txt` | UI element naming & labelling guide | DOM selector strategy for Playwright |

### Codebase Archive
- **File**: `D:\TcsQET\QET CFA.zip`
- **Size**: 252 KB (163 files after extraction)
- **Key Components**:
  - `QET CFA/cfa-digital-journey/app.py` — Main Streamlit app
  - `QET CFA/cfa-digital-journey/agents/` — AI agent crew
  - `QET CFA/cfa-digital-journey/components/` — UI components
  - `QET CFA/cfa-digital-journey/services/` — Profile, KYC, eligibility, payment services
  - `QET CFA/cfa-digital-journey/data/` — SQLite DB schema
  - React login/form/document components in `src/pages/`

---

## API Endpoint Spec

### `POST /api/v1/runs/{run_id}/load-sample-data`

**Request Body:**
```json
{
  "sample_id": "qet-cfa-v1",
  "include_documents": true,
  "include_codebase": true
}
```

**Response:**
```json
{
  "run_id": "RUN-...",
  "loaded_documents": ["agentspec.txt", "designdoc.txt", "..."],
  "loaded_codebase": "QET CFA.zip",
  "intake_manifest": { ... }
}
```

---

## UI Component Spec

### Sample Data Selector Modal
```
┌─ Load Sample Data ─────────────────────────────────────┐
│  ● QET CFA Digital Journey (Recommended)               │
│    8 requirement docs · QET CFA.zip (163 files)        │
│    [Load Both] [Load Docs Only] [Load ZIP Only]        │
│                                                        │
│  ○ Simple CFA Sample (4 files stub)                    │
│    3 React components · cfa_digital_journey_sample.zip │
│    [Load Both]                                         │
└────────────────────────────────────────────────────────┘
```
