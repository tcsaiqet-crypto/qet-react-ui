# In-Lane Agent Flow & Bottom Progression Buttons Specification

## 1. Goal
Ensure the user has clear, unambiguous visual guidance after each agent finishes, with a prominent **"Next Step: Proceed to [Agent Name]"** action card located at the bottom of the main working panel.

---

## 2. Linear Stage Transitions

```
[Phase 1: Document & Codebase Intake]
   │
   ▼ (Bottom CTA: "Proceed to Application Understanding →")
[Phase 2: UI Requirements & Application Understanding]
   │
   ▼ (Bottom CTA: "Run Test Generation Agents →")
[Phase 3: Test Synthesis & Playwright Script Generation]
   │
   ▼ (Bottom CTA: "Proceed to Execution Workspace →")
[Phase 4: Selective Execution & Playwright Runner]
   │
   ▼ (Bottom CTA: "View Quality & Allure Report →")
[Phase 5: Quality Dashboard & Artifact Export]
```

---

## 3. Standardized Progression Banner Design

Every completed stage displays a standardized bottom banner:

```tsx
<div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-950/10">
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 shrink-0">
      <PlayCircle className="w-5 h-5 text-emerald-400" />
    </div>
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
          {stageTitle} Completed
        </h3>
        <span className="qet-badge-success text-[10px] uppercase font-bold px-2 py-0.5">
          Next Step
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
        {stageNextDescription}
      </p>
    </div>
  </div>
  <button
    onClick={onProceedNext}
    className="qet-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md whitespace-nowrap cursor-pointer rounded-xl"
  >
    <span>{buttonLabel}</span>
    <ArrowRight className="w-4 h-4" />
  </button>
</div>
```
