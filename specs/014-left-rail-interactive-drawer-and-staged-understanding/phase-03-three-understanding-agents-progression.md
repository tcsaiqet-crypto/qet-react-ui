# Phase 03: Staged 3-Agent Understanding Flow

## 1. Goal
Orchestrate the intake workflow into a clear, staged sequence for the **3 Understanding Agents** on `HomeUploadPage.tsx`.

---

## 2. Hero Motion & State Transitions

### Stage 1: Requirement Understanding Agent (Hero 1)
- **Active State**: Large dropzone card prominently displayed in the center with drag-and-drop support for `.md`, `.pdf`, `.txt`, and `.docx` specs.
- **Completion Transition**: Once documents are uploaded and indexed, the card smoothly shrinks and animates upward into a compact **Indexed Document Summary Strip** with a quick `Re-upload` button.

### Stage 2: Document Intake Agent &middot; Codebase Intake (Hero 2)
- **Active State**: The Codebase ZIP card expands into the primary hero card with dropzone for `.zip` source archives.
- **Completion Transition**: Once the archive is unpacked and AST is extracted, it collapses into a **Codebase Summary Strip** showing total files, component count, and selector inventory.

### Stage 3: Application Understanding Agent (Hero 3)
- **Active State**: Takes full center stage for deep AI synthesis.
- **Live Activities Displayed**:
  - `UI Journey Synthesizer`: Discovers DOM selectors, state transitions, and authentication flows.
  - `Requirement Gap Analyzer`: Evaluates the 15-point checklist baseline and calculates application testability score.
  - Live animated console and structured failure remediation hints.
