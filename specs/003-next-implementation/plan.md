# Architecture & Plan 003: Bridge Implementation

## 1. Component Flow
`App.tsx` orchestrates main navigation, listens to active run status updates via polling, and provides context to `HomePage`, `UnderstandingPage`, and `ExecutionPage`.
