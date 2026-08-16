# Feature 01b: Codebase Intake Sub-Agent

## 1. Overview

The Codebase Intake Sub-Agent is the **second sub-agent** under the Application Understanding Agent. It accepts a ZIP archive of the target application's source code, safely extracts it (with Zip Slip defense), and indexes the codebase structure for use by the Requirement Understanding Sub-Agent.

---

## 2. Input Specifications

| Property | Constraint |
| :--- | :--- |
| Format | `.zip` archives only |
| Max Size | 200 MB compressed |
| Max Extracted Files | 5,000 files |
| Allowed Source Extensions | `.tsx`, `.ts`, `.jsx`, `.js`, `.py`, `.java`, `.cs`, `.go`, `.md`, `.json`, `.yaml`, `.html`, `.css` |
| Blocked Paths | Any path containing `../` (Zip Slip defense) |

---

## 3. User Stories

- **US-1**: As a QA engineer, I can upload a ZIP file of my application's codebase by drag-and-drop or file browser.
- **US-2**: As a QA engineer, I see a real-time extraction progress bar and log showing file count extracted.
- **US-3**: As a QA engineer, I see a structured tree view of the top-level directories and files discovered after extraction.
- **US-4**: As a QA engineer, I see summary statistics: total files, total lines of code, detected tech stack (React, Python, etc.), and supported file types found.
- **US-5**: As a QA engineer, I can replace the uploaded codebase by uploading a new ZIP (clears old extraction).
- **US-6**: As a QA engineer, if the ZIP contains unsupported files or blocked paths, I see a clear warning but extraction continues for the valid files.

---

## 4. Workspace UI Design

```
┌─ Codebase Intake ──────────────────────────────────────────────────────┐
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │          ⬆ Drag & drop your codebase ZIP here                    │ │
│  │                or  [Browse ZIP File]                              │ │
│  │     .zip only  •  Max 200MB  •  Zip Slip protection active       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Extraction Complete ✅                                                 │
│                                                                        │
│  📊 Extraction Summary                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Total Files:    1,247    │  Total Size:  8.4 MB                 │  │
│  │  Source Files:   432      │  Tech Stack:  React + Python FastAPI │  │
│  │  .tsx / .ts:    298       │  .py:   134   │  .md:  15            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  📁 Directory Structure (top 3 levels)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  qet-react-ui/                                                   │  │
│  │  ├── src/                                                        │  │
│  │  │   ├── components/   (42 files)                                │  │
│  │  │   └── services/     (8 files)                                 │  │
│  │  └── backend/                                                    │  │
│  │      └── src/agents/   (12 files)                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─ Bottom CTA ────────────────────────────────────────────────────┐   │
│  │  ✅ Codebase indexed   [Confirm Codebase Intake →]               │   │
│  └────────────────────────────────────────────────────────────────-┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: ZIP Upload & Validation
- Accept `.zip` only; reject other archive formats with a specific error.
- Validate no path contains `../` before extraction begins (Zip Slip defense).
- If any malicious paths found, reject entire upload and display alert.
- Show upload progress bar for files >10 MB.

### FR-2: Extraction Process
- Extract to `uploads/{run_id}/codebase/`.
- Only extract files with supported source extensions.
- Skip binaries, images, compiled artifacts (`.pyc`, `.class`, `.exe`, `.png`, `.jpg`, etc.).
- Log each extracted file with its relative path and size to the run log.

### FR-3: Extraction Summary
- Display immediately after extraction completes:
  - Total files extracted
  - Total extracted size
  - Breakdown by extension
  - Detected tech stack (heuristic: look for `package.json`, `requirements.txt`, `pom.xml`, etc.)
  - Top-level directory tree (3 levels max)

### FR-4: Source Snapshot for AI
- Build a text "source snapshot" (max 20 files × 500 chars per file) that the Requirement Understanding Sub-Agent will feed into its prompt.
- Prioritize: page components, API endpoints, form definitions, route configs.

### FR-5: Re-Upload
- If a codebase was already uploaded, show a `[Replace Codebase]` button.
- Replacing clears `uploads/{run_id}/codebase/` and resets sub-agent 1b status to `pending`.
- Re-uploading does NOT reset sub-agent 1a (requirement docs) or sub-agent 1c outputs.

### FR-6: Completion Gate
- `[Confirm Codebase Intake]` button activates only after successful extraction.
- Clicking confirm marks sub-agent 1b as `completed` and focuses workspace on sub-agent 1c.

---

## 6. Backend API Contracts

```
POST /api/v1/runs/{run_id}/codebase
  Body: multipart/form-data
  Field: file (the .zip archive)
  Response: {
    extraction_stats: {
      total_files: int,
      source_files: int,
      total_size_bytes: int,
      tech_stack: string[],
      extensions: { [ext]: count }
    },
    directory_tree: string,
    source_snapshot: string
  }

GET /api/v1/runs/{run_id}/codebase/stats
  Response: (same extraction_stats as above)

DELETE /api/v1/runs/{run_id}/codebase
  Response: { cleared: true }
```

---

## 7. Acceptance Criteria
- [ ] ZIP upload works via drag-and-drop and browse.
- [ ] Zip Slip defense correctly blocks `../` paths.
- [ ] Extraction stats show total files, size, tech stack, and extension breakdown.
- [ ] Top-level directory tree renders correctly.
- [ ] Replace codebase clears old extraction without resetting docs.
- [ ] Confirm button activates and moves focus to Requirement Understanding.
- [ ] Extraction state persists across browser refresh.
