# Spec Constitution (Spec-Kit 014)

## 1. Design & UX Principles
1. **Never Disorient the Operator**: When selecting an agent in the left rail or opening the right drawer, the operator must never lose their scroll position or current workspace context.
2. **Deterministic State Synchronization**: The left rail, center workspace, and right drawer must strictly draw from the single source of truth (`appState` via `resolveAgentFlow`).
3. **Progressive Disclosure**: Do not overwhelm the user with 11 technical pipeline stages during initial document/codebase intake. Emphasize the 3 Understanding Agents first, expanding cleanly as the workflow progresses.
4. **Responsive Collapsibility**: The right drawer must never obstruct critical action buttons on mobile/tablet viewports; it must collapse to a floating pill or dock gracefully beside the main canvas on widescreen displays.
5. **Aesthetic Excellence**: Use consistent design tokens (`var(--qet-surface)`, `var(--qet-accent)`, `var(--qet-border)`), glassmorphism subtle overlays, and smooth CSS transitions (`animate-slide-down`, `animate-hero-enter`).

---

## 2. Technical Constraints
- No third-party UI component libraries (keep vanilla CSS / Tailwind utility tokens matching existing design system).
- Keep all unit tests passing (`vitest run`, `pytest backend/tests`).
- Maintain backward compatibility with existing backend REST routes and run state persistence.
