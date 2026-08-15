# Outputs And Artifacts

| Agent | Primary output |
|---|---|
| Intake Orchestrator | Intake manifest, upload summaries, file decisions |
| Understanding Agent | Application understanding, inventories, validation, gaps |
| Requirement Categorizer | Requirement categories and traceability |
| Test Case Agent | Test suite and requirement mappings |
| Test Data Agent | Synthetic dataset and data provenance |
| Playwright Agent | Page objects, scripts, execution evidence |
| Report Agent | HTML/PDF/JSON quality reports |

Every artifact must include `run_id`, `generation`, `created_at`, and provenance. Invalidated artifacts must not appear as current outputs.
