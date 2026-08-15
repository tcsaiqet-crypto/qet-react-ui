# Spec 015: Consolidated Platform Feature Architecture & Gap Verification

## 1. Objectives & Scope
This specification consolidates and formalizes all 18 core platform capabilities identified across git commit logs and historical pull requests to guarantee ongoing platform integrity and prevent feature divergence.

## 2. Core Functional Pillars
1. **Pipeline & Execution Lifecycle Controls**:
   - Pause, Stop, and Idempotent Resume for both sequential agent stages and live test execution queues.
2. **Dedicated Test Scripts & Live Headed Execution**:
   - Separate test script files (`tests/test_{case_id}_{slug}.py`) per scenario.
   - Headed desktop window execution (`--headed`) with live streaming terminal logs.
3. **Visual Screenshot Evidence & Multi-Level Reporting**:
   - Full-page screenshots for positive passes and negative rejection states.
   - 3-tier multi-level JSON diagnostic report (`summary` -> `breakdown_by_case_type` -> `per_script_detail` with `why_passed` / `why_failed` explanations).
4. **AI Test Intelligence & Script Auto-Healing**:
   - Health score computation (0-100), 7-tier defect classification, and side-by-side script diff healer.
5. **Observability & Logging Console**:
   - Console logs drawer with log level filtering, real-time keyword search, match highlighting, and auto-scroll.
6. **Agent Choreography & Interactive Navigation**:
   - 2-level Left Rail agent timeline and slide-out inspector drawer.
7. **Intake Processing & Requirement Intelligence**:
   - Zip Slip protected 2-lane upload zone and 10-category requirement taxonomy classification.
