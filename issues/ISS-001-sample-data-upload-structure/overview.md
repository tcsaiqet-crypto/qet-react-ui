# ISS-001 · Sample Data Upload Structure

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: Home → Document Intake & Codebase Upload

---

## Problem Statement

The **"Sample Data Upload"** folder exists at `d:\TcsQET\qet-react-ui\sample data upload\` but the UI does not reference or expose it. The user expects:

1. The requirement upload lane to have **8 specific MD files** pre-available from `d:\TcsQET\qet-react-ui\sample data upload\requirement\`
2. The codebase ZIP upload lane to point to **`QET CFA.zip`** as the canonical sample archive
3. Both these to be grouped under a **"QET CFA"** sample data entry in the UI

---

## Current State

| What | Current State |
| --- | --- |
| Sample folder | `sample data upload/requirement/` has 8 txt/md files |
| UI exposure | No "Use Sample Data" button or link exists |
| Canonical zip | `D:\TcsQET\QET CFA.zip` (252 KB, 163 files) not linked |
| QET CFA grouping | Does not exist in UI |

---

## Functional Requirements

### FR-001-A: Sample Data Section in Upload Lanes
- Both upload lanes (docs and zip) should show a `"Use Sample Data"` secondary action
- Clicking it opens a modal/dropdown showing available pre-loaded samples
- Sample entries: grouped under `QET CFA Digital Journey`

### FR-001-B: QET CFA Sample Package
- **Requirement Files** (8 MD files):
  - `agentspec.txt` → Requirements Agent Specification
  - `analysis chatting with ai.txt` → AI Analysis Context  
  - `datamodel.txt` → Data Model Specification
  - `designdoc.txt` → Design Document
  - `knowledgebase.txt` → Knowledge Base
  - `requirement1.txt` → Core Requirements
  - `sessionlog.txt` → Session Context Log
  - `uilabelling.txt` → UI Labelling & Naming Guide
- **Codebase Archive**: `D:\TcsQET\QET CFA.zip` (163 source files, 252 KB)

### FR-001-C: Auto-Load on Selection
- Clicking a sample package → auto-loads it via the existing `/api/v1/runs/{run_id}/documents/upload` endpoint
- Show loading state identical to manual upload
- No re-upload prompt after sample load

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/HomeUploadPage.tsx` | Add `"Use Sample Data"` button + sample selector modal |
| `backend/src/api/fastapi_app.py` | Add `POST /api/v1/runs/{run_id}/load-sample-data` endpoint |
| `sample data upload/` | Rename `.txt` files to `.md` where applicable |
