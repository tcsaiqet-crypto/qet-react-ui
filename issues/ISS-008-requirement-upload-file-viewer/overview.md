# ISS-008 · Requirement Upload — 8 MD Files Viewer in UI

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: Home → Requirement Upload Lane → Doc Accordion

---

## Problem Statement

After uploading the 8 requirement documents, the user can expand the doc accordion and see the file list. However:

1. Files listed show only filename — no file type badge or icon indicating `.txt` vs `.md`
2. No **preview** option to see what's inside each requirement file
3. Files cannot be individually removed/replaced
4. The filter pills (`All`, `Included`, `Excluded`, `Reviewed`) don't reflect meaningful states for requirement docs

---

## Functional Requirements

### FR-008-A: File Type Badges in Doc List
- `.md` files → `Markdown` badge (blue)
- `.txt` files → `Text` badge (slate)
- `.pdf` files → `PDF` badge (red)
- `.docx` files → `Word` badge (blue)

### FR-008-B: Inline Preview Modal
- Each doc file row gets a `[Preview]` button
- Opens a modal showing first 500 characters of text
- For large files: shows "Preview limited to first 500 chars · Full file indexed by AI"

### FR-008-C: Individual File Removal
- Each doc row gets an `[X]` remove button
- Removing re-triggers re-indexing of remaining files

### FR-008-D: Requirement File Count in Summary Card
- Summary card: `"8 Requirement Documents Indexed"`
- Sub-line: `"6 Markdown · 2 Text · 0 PDF"`

### FR-008-E: "Reviewed" Filter Meaning
- `Reviewed` = files that have been sent to AI for understanding
- After AI understanding runs, files become `Reviewed` 
- Filter pill should show count: `Reviewed (8)`

---

## UI Mock

```
┌─ 1. Requirement Understanding Agent ──────────────────────┐
│  ✅ Indexed          [Collapse File Details ∧]            │
│  8 Requirement Documents Indexed                          │
│  6 Markdown · 2 Text · 0 PDF                             │
│                                                           │
│  [All (8)] [Markdown (6)] [Text (2)] [Reviewed (8)]       │
│                                                           │
│  📄 agentspec.txt         [Text]    [Preview] [×]         │
│  📝 designdoc.txt         [Text]    [Preview] [×]         │
│  📝 datamodel.txt         [Text]    [Preview] [×]         │
│  📝 requirement1.txt      [Text]    [Preview] [×]         │
│  📝 uilabelling.txt       [Text]    [Preview] [×]         │
│  📝 sessionlog.txt        [Text]    [Preview] [×]         │
│  📝 knowledgebase.txt     [Text]    [Preview] [×]         │
│  📝 analysis chatting...  [Text]    [Preview] [×]         │
└───────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/HomeUploadPage.tsx` | Update doc file rows with type badges, preview button, remove button |
| `backend/src/api/fastapi_app.py` | Add `GET /api/v1/runs/{run_id}/documents/{filename}/preview` |
| `src/services/apiClient.ts` | Add `previewDocument(runId, filename)` |
