# Constitution: Spec-Kit 024 — Architectural Governance

## Core Principles (Non-Negotiable)

### Principle I: AI-First, No Fallbacks
Every agent stage must produce its output via AI. There is no sample data, no static stubs, no placeholder content. If AI fails, the agent fails clearly with an actionable recovery message.

### Principle II: One Script Per Test Case
Every generated test case has exactly one dedicated Python Playwright file. No monolithic test runners. No shared scripts across cases.

### Principle III: Dual Evidence on Every Execution
Every executed test case produces exactly two screenshots: one for the PASSED state and one for the FAILED state (where possible). These are linked directly to the test case in the Dashboard.

### Principle IV: Left Rail = Sole Navigation
There are no top-navigation tabs. The user advances through the pipeline exclusively via: (a) left-rail agent selection and (b) bottom progression CTAs.

### Principle V: Parent-Child Agent Hierarchy
The Application Understanding Agent is the parent of the three intake/understanding sub-agents. Sub-agent status independently tracked. Parent status is derived from child statuses.

### Principle VI: Grounded Selectors Only
All DOM selectors used in generated Playwright scripts must be derived from actual codebase evidence (data-testid, IDs, ARIA roles). Fabricated selectors are flagged as uncertain and highlighted to the user.

### Principle VII: Full Artifact Traceability
Every piece of output (test case, data record, script, screenshot, execution log, report) is saved as a named artifact with a consistent path structure and accessible from the Dashboard.

### Principle VIII: Progressive Disclosure
Each agent's workspace only becomes interactive after its upstream dependencies are satisfied. Blocked agents clearly show what is missing rather than silently failing.
