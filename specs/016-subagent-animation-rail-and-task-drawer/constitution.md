# Constitution: UI Choreography and One-Button Interaction Rules

## 1. The "One Primary Button" UX Constraint
- Each agent card on the left rail must feature **exactly ONE primary call-to-action button** in its normal state (e.g. "Run Understanding", "Generate Tests", "Launch Execution").
- Secondary actions (such as Retrying a specific sub-step, downloading raw JSON artifacts, or viewing diagnostics) must be located inside the Right Inspector Drawer or triggered via contextual menus to prevent visual clutter.

## 2. Micro-Animation and Auto-Progression
- When an agent transitions from `running` to `completed`:
  1. The active pulsing glow stops, and a checkmark badge is revealed.
  2. The completed agent card smoothly collapses into a compact 48px height summary card.
  3. The viewport automatically scrolls to focus on the next active agent card, expanding its details.
- Transitions must respect `prefers-reduced-motion` and maintain 60fps performance without layout shifting.
