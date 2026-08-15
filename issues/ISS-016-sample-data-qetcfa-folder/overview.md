# ISS-016 · Sample Data Upload — QET CFA Folder Structure on Disk

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: File System → sample data upload/ folder

---

## Problem Statement

The user explicitly asked:
> "both of this under QETCFA folder under sample data upload"

Currently `d:\TcsQET\qet-react-ui\sample data upload\` only has a `requirement/` subfolder.  
The required structure is:

```
sample data upload/
└── QETCFA/                          ← New folder to create
    ├── requirement/                  ← The 8 existing MD/TXT files
    │   ├── agentspec.txt
    │   ├── analysis chatting with ai.txt
    │   ├── datamodel.txt
    │   ├── designdoc.txt
    │   ├── knowledgebase.txt
    │   ├── requirement1.txt
    │   ├── sessionlog.txt
    │   └── uilabelling.txt
    └── codebase/
        └── QET CFA.zip              ← Copy/symlink of D:\TcsQET\QET CFA.zip
```

---

## What Needs to Be Done

### Step 1 — Reorganize on Disk
```powershell
# Create QETCFA structure
New-Item -ItemType Directory "d:\TcsQET\qet-react-ui\sample data upload\QETCFA\requirement"
New-Item -ItemType Directory "d:\TcsQET\qet-react-ui\sample data upload\QETCFA\codebase"

# Move existing requirement files
Move-Item "d:\TcsQET\qet-react-ui\sample data upload\requirement\*" `
          "d:\TcsQET\qet-react-ui\sample data upload\QETCFA\requirement\"

# Copy the full QET CFA zip into codebase folder
Copy-Item "d:\TcsQET\QET CFA.zip" `
          "d:\TcsQET\qet-react-ui\sample data upload\QETCFA\codebase\QET CFA.zip"
```

### Step 2 — Update Backend Sample Data Loader
File: `backend/src/api/fastapi_app.py`

The `load-sample-data` endpoint should look for:
- Requirement files at: `sample data upload/QETCFA/requirement/`
- Codebase ZIP at: `sample data upload/QETCFA/codebase/QET CFA.zip`

### Step 3 — Update UI Sample Selector (ISS-001 dependency)
The sample selector modal (ISS-001) should read the folder structure dynamically:
- Scan `sample data upload/` for subdirectories
- Each subdirectory = one sample package
- Show package name, file count, zip name

---

## Acceptance Criteria

- [ ] `sample data upload/QETCFA/requirement/` contains all 8 files
- [ ] `sample data upload/QETCFA/codebase/QET CFA.zip` is present
- [ ] Backend endpoint reads from correct new paths
- [ ] UI sample selector shows "QET CFA Digital Journey" package
