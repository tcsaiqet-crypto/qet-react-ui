# Specification: ISS-003 — Dual Upload Lanes UI Layout Optimization

## 1. Problem Statement
In previous iterations, the `HomeUploadPage` rendered decorative subagent telemetry blocks and duplicate stage headers at the top of the screen. This pushed the core upload lanes below the fold, forcing users to scroll before they could drag and drop their test artifacts.

## 2. User Stories
- **US-1**: As a user arriving on the platform, I want to immediately see the two designated upload areas for Specifications and Codebase so I can begin testing without confusion.
- **US-2**: As a user dragging files onto the screen, I want clear visual feedback showing which lane will receive my documents.
- **US-3**: As a QA lead, I want to review the list of staged files with file size indicators and delete buttons before initiating autonomous analysis.

## 3. Functional Requirements
1. **Dual Lane Separation**:
   - **Lane A (Requirements & Specs)**: Accepts `.pdf`, `.docx`, `.md`, `.txt`. Multi-file selection enabled.
   - **Lane B (Target Codebase)**: Accepts `.zip`, `.tar.gz`, or source file packages.
2. **Processing & Status Bar**:
   - Displays dynamic state pills: `READY`, `UPLOADING`, `PROCESSING`, `SUCCESS`, or `ERROR`.
   - Single prominent CTA button: "Start Autonomous Analysis & Understanding".
3. **Preset / Sample Data Loading**:
   - Provides 1-click sample project loader buttons ("Load E-Commerce Sample", "Load Auth Portal Sample") for instant demo evaluation.

## 4. Acceptance Criteria
- [x] Initial page load renders both upload lanes centered and completely visible above the fold.
- [x] Dropping files updates the file list state in < 50ms.
- [x] Clicking "Start Autonomous Analysis" smoothly transitions the user to the Stage 2 (Requirement Understanding) view.
