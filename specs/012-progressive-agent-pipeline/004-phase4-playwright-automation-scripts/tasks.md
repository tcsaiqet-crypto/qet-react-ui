# Tasks 004: Phase 4 Actionable Checklist

## Backend Script Synthesis Service
- [ ] Implement POM class generator based on AST component selectors.
- [ ] Implement Playwright `@playwright/test` TypeScript spec generator.
- [ ] Implement Data-Driven parameter injection from active Test Data Hub.
- [ ] Expose endpoint `GET /api/v1/runs/{run_id}/playwright/bundle` to download script zip.

## Sub-Agents Execution Pipeline
- [ ] Sub-Agent 4.1: POM Synthesizer.
- [ ] Sub-Agent 4.2: Playwright Spec Generator.
- [ ] Sub-Agent 4.3: Data-Driven Harness Binder.

## UI Component & Progressive Collapse
- [ ] Create `PlaywrightScriptCard.tsx` with right-hand sub-agent step rail.
- [ ] Render file tree and syntax-highlighted script viewer.
- [ ] Implement copy file and download `.zip` action.
- [ ] Add bottom CTA: `"Launch Execution Workspace →"`.
- [ ] Implement auto-collapse and auto-scroll to Phase 5 on CTA click.
