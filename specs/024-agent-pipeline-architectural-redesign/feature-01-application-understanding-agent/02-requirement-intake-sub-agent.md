# Feature 01a: Requirement Intake Sub-Agent

## 1. Overview

The Requirement Intake Sub-Agent is the **first sub-agent** under the Application Understanding Agent. Its sole responsibility is ingesting the user's requirement documents (Markdown, PDF, or plain text files) and making them available for AI analysis.

This replaces the current "Upload Documents" zone on the home page and becomes a dedicated workspace panel activated when the user selects sub-agent 1a in the left rail.

---

## 2. Supported Input Formats

| Format | Extension | Max Size |
| :--- | :--- | :--- |
| Markdown | `.md` | 5 MB per file |
| Plain Text | `.txt` | 5 MB per file |
| PDF | `.pdf` | 10 MB per file |
| Word Document | `.docx` | 10 MB per file |

- **Maximum files**: 20 documents per run
- **Minimum files**: 1 document required to proceed

---

## 3. User Stories

- **US-1**: As a QA engineer, I can drag-and-drop or click to browse and upload 1 to 20 requirement documents.
- **US-2**: As a QA engineer, I see an uploaded file list with filename, file type badge, file size, upload timestamp, and a `[Remove]` button for each file.
- **US-3**: As a QA engineer, I can preview the raw content of any uploaded document by clicking its filename.
- **US-4**: As a QA engineer, after uploading at least 1 file, a `[Confirm Requirement Intake]` button becomes active to mark this sub-agent as complete.
- **US-5**: As a QA engineer, I am prevented from uploading unsupported file types with a clear error toast.

---

## 4. Workspace UI Design

```
┌─ Requirement Intake ─────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │          ⬆ Drag & drop requirement documents here                   │ │
│  │              or  [Browse Files]                                     │ │
│  │  Supported: .md .txt .pdf .docx  •  Max 20 files  •  5-10MB each   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Uploaded Documents (8 files):                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ 📄 CFA_Functional_Requirements.md   [MD] 142KB  [Preview] [✕]   │    │
│  │ 📄 CFA_User_Journeys.md             [MD]  89KB  [Preview] [✕]   │    │
│  │ 📄 CFA_API_Contracts.md             [MD]  67KB  [Preview] [✕]   │    │
│  │ 📄 CFA_Accessibility_Guidelines.pdf [PDF] 2.1MB [Preview] [✕]   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─ Bottom CTA ─────────────────────────────────────────────────────┐    │
│  │  ✅ 8 documents ready   [Confirm Requirement Intake →]            │    │
│  └─────────────────────────────────────────────────────────────────-┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: File Upload
- Accept via drag-and-drop or file browser dialog.
- Validate MIME type and extension before accepting.
- Show upload progress bar per file (if >1MB).
- Store uploaded files in `uploads/{run_id}/docs/`.

### FR-2: File List Management
- Display all uploaded files in an ordered list.
- Each row: icon, filename, file type badge, size, upload time, `[Preview]`, `[Remove]`.
- `[Remove]` deletes the file from the run's document directory.
- Allow re-upload of a removed file.

### FR-3: Document Preview
- Click `[Preview]` opens a right-side drawer or modal showing the raw text content.
- PDF previews show extracted text (not rendered PDF for simplicity).

### FR-4: Completion Gate
- Minimum 1 file uploaded → `[Confirm Requirement Intake]` button becomes active.
- Clicking confirm marks sub-agent 1a as `completed` and focuses the workspace on sub-agent 1b.

### FR-5: Validation Feedback
- Unsupported format: toast `"Only .md, .txt, .pdf, .docx files are accepted"`
- File too large: toast `"File exceeds maximum allowed size (10 MB)"`
- Duplicate file: toast `"A file with this name is already uploaded. Remove it first."`

---

## 6. Backend API Contracts

```
POST /api/v1/runs/{run_id}/documents
  Body: multipart/form-data
  Fields: files[] (array of uploaded files)
  Response: { uploaded: string[], failed: string[] }

GET /api/v1/runs/{run_id}/documents
  Response: { files: [{ name, size, type, uploaded_at }] }

DELETE /api/v1/runs/{run_id}/documents/{filename}
  Response: { removed: true }
```

---

## 7. Acceptance Criteria
- [ ] Drag-and-drop and browse both work.
- [ ] 8 CFA reference documents can be uploaded simultaneously.
- [ ] Each file shows correct metadata and remove option.
- [ ] Unsupported files trigger appropriate error toast.
- [ ] Confirm button activates after ≥1 file and moves focus to Codebase Intake.
- [ ] Uploaded files persist across browser refresh.
