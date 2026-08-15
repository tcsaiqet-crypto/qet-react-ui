# Gemini Agent Model and Prompt Routing

## Purpose

This document explains how QET currently selects an AI provider, Gemini API key, and Gemini model; which agents use AI; and how prompts should be governed. It intentionally never includes API-key values.

## Current Provider and Key Behavior

Gemini is the persisted default provider. The active provider is stored in `backend/workspace/ai_settings.json` and resolved by `AppConfig.get_active_provider()`.

### Gemini key precedence

`AppConfig.get_provider_api_keys("gemini")` builds an ordered, de-duplicated key pool:

1. Runtime AI settings (`provider_keys.gemini`)
2. `GEMINI_API_KEY`
3. `GOOGLE_API_KEY`
4. Supported local Gemini key files under `backend/keys`, project `keys`, and `backend/api`

The system rejects blank and obvious placeholder keys. Key values must never be included in logs, UI responses, source control, or this document.

### Provider behavior

- Gemini is selected by default.
- An explicit GPT selection is still allowed in the UI.
- `UnderstandingAgent` respects the selected provider and fails transparently if that selected provider cannot serve the request.
- `LLMService.generate_text()` can fall back from GPT to the Gemini key pool if GPT fails. This fallback behavior should be documented in user-facing diagnostics whenever it occurs.

Relevant implementation:

- `backend/src/config.py`: key-source precedence and active provider
- `backend/src/services/ai_settings_store.py`: persisted provider and runtime key overrides
- `backend/src/services/llm_service.py`: key rotation, model discovery, and provider calls
- `backend/src/api/fastapi_app.py`: settings and verification endpoints

## Current Gemini Model Selection

QET does not currently configure a fixed Gemini model per agent.

For each available Gemini key, `LLMService`:

1. Calls Gemini `ListModels`.
2. Keeps models that support `generateContent`.
3. Excludes specialized or preview families, such as image, TTS, robotics, research, and preview models.
4. Ranks candidates in this order:
   - `*-latest` first
   - Flash
   - Flash Lite
   - Pro
   - other text-capable models
5. Attempts the ranked models until one returns usable text.
6. Caches the successfully working model for that key for the current process.
7. Moves to the next Gemini key if all candidate models for a key fail.

Current generation settings are low variance: temperature `0.2`, maximum output `2500` tokens, and a shared JSON-only instruction.

Implication: model selection is resilient to Gemini catalog changes, but all AI agents currently use the same discovered best model for a given key. There is no current per-agent model policy in code.

## Agent Inventory and AI Usage

| Agent | Uses Gemini/LLM today? | Current behavior | Recommended model tier | Why |
| --- | --- | --- | --- | --- |
| Understanding Agent | Yes, AI required | Synthesizes source, documents, flows, components, gaps, and testability | Flash first; Pro fallback for unusually large/ambiguous source snapshots | Needs structured reasoning with responsive turnaround |
| Requirement Categorizer | Yes when AI-required path is used | Produces typed requirement catalog | Flash or Flash Lite | Narrow classification task with strict enum output |
| Test Case Agent | Yes, AI required | Produces 10-14 typed test cases | Flash first; Pro fallback only for large requirement sets | Structured generation; may need more output budget |
| Test Data Agent | No | Deterministic synthetic data | None | Predictability and non-PII guarantees are more important than model creativity |
| Playwright Agent | No | Template-based script/package generation from known selectors and data | None | Generated automation must remain deterministic and reviewable |
| Accessibility Agent | No | Static local WCAG source scan | None | Regex/rule engine should remain repeatable and offline |
| Report Agent | No | Deterministic HTML/PDF report assembly | None | Report must reflect recorded artifacts, not model interpretation |
| Execution Engine | No | Runs approved Playwright scripts | None | Browser execution must not delegate safety decisions to an LLM |

### Recommendation boundaries

Use AI only where interpretation or structured synthesis adds value. Do not use Gemini for safety gates, execution approval, deterministic artifact generation, or evidence reporting. Those responsibilities should remain code-driven.

## Prompt Behavior by AI Agent

### Understanding Agent

Current prompt builds a strict JSON application-analysis request from:

- uploaded requirement-document names
- extracted source snapshot
- expected summary, architecture, components, flows, gaps, entry points, and testability observations

It appends the shared JSON-only instruction. The current prompt is assembled in `UnderstandingAgent.run_ai_required()`.

Recommended additions:

- Prefer stable `[data-testid]` selectors; report other selector types with lower confidence.
- Do not invent routes, APIs, requirements, or selectors absent from supplied evidence.
- Include source file paths for every component, flow, and gap where evidence exists.
- State output priority when token-limited: summary, components, flows, then gaps.
- Add a prompt version identifier to provenance.

### Requirement Categorizer

Current prompt asks for a strict requirement catalog with a closed type enum:

`Functional`, `NonFunctional`, `Security`, `Performance`, `Accessibility`, `Reliability`, `Integration`, `Compliance`, `DataQuality`, `Usability`.

Recommended additions:

- Use `Uncategorized` only when evidence does not support a valid category.
- Preserve requirement evidence instead of summarizing it away.
- Do not create requirements with no source component, gap, or document evidence.
- Include category consistency examples for security, accessibility, and integration cases.

### Test Case Agent

Current prompt asks for a strict JSON `test_cases` array with 10-14 cases covering positive, negative, boundary, validation, and error-handling behavior. It includes the application summary and feature areas, or categorized requirements when that feature is enabled.

Recommended additions:

- Each test case must map to a requirement or an explicit gap.
- Mark `automation_candidate` false when the generated evidence cannot support stable automation.
- Include expected observable outcomes, not vague assertions.
- Require synthetic-data keys only for data the test actually consumes.
- Prioritize critical/high-risk coverage before optional boundary breadth when output is constrained.
- Increase output budget only for large requirement catalogs after measuring truncation, rather than globally.

## Recommended Future Per-Agent Model Policy

This is a proposed policy; it is not implemented yet.

| Policy key | Preferred Gemini capability | Fallback | Temperature | Output budget | Use |
| --- | --- | --- | --- | --- | --- |
| `understanding` | Latest Flash text model | Latest Pro text model | 0.2 | 3000-4000 for large source snapshots | Deep source/document synthesis |
| `categorization` | Latest Flash Lite or Flash text model | Latest Flash text model | 0.0-0.1 | 1800-2500 | Closed-enum classification |
| `test_cases` | Latest Flash text model | Latest Pro text model | 0.1-0.2 | 3000 for requirement-heavy suites | Structured scenario generation |
| `deterministic` | No model | No model | N/A | N/A | Test data, scripts, accessibility, reports, execution |

The policy should choose from discovered, supported models instead of hardcoding a model name. A capability profile such as `flash`, `flash_lite`, or `pro` should be resolved using the current `ListModels` result per key.

## Prompt and Model Governance

### Required provenance for every AI artifact

Store these fields with AI-produced artifacts:

- provider
- discovered model name
- prompt version
- generation timestamp
- source artifact identifiers
- validation status
- fallback status and reason

### Required validation

1. Parse JSON using the shared parser.
2. Validate the parsed object against Pydantic contracts.
3. Reject incomplete or schema-invalid AI output rather than silently inventing data.
4. Record a safe diagnostic summary without recording API keys or full sensitive source content.

### Recommended prompt organization

Create a future `backend/src/prompts/` module with versioned functions or files, for example:

```text
backend/src/prompts/
  understanding_v1.py
  requirement_categorization_v1.py
  test_cases_v1.py
```

Each prompt should expose a version constant and a typed builder. The agent stores that version in provenance.

## Implementation Plan

1. Preserve Gemini as the persisted default provider.
2. Add a per-agent capability policy to `LLMService` without exposing key values.
3. Record actual selected model and prompt version in each AI artifact provenance.
4. Move the three prompt builders into versioned prompt modules.
5. Add prompt-contract tests with fixture source snapshots and JSON validation.
6. Measure truncation and JSON-invalid rates before changing model tiers or token budgets.

## Discussion Summary

The right model is based on task shape, not simply on a different API key:

- Use a fast structured text model for normal Understanding and Test Case generation.
- Use a stronger reasoning fallback only for larger or ambiguous analysis inputs.
- Use a lightweight model for closed-enum categorization.
- Keep deterministic agents model-free.
- Rotate keys only when a key/model attempt fails; never assign different keys to agents for arbitrary behavior.

This keeps costs and latency controlled while preserving reliable, auditable QET artifacts.

## Final Implemented Routing (2026-08-15)

This section supersedes earlier proposed-policy wording in this document.

### Implemented profiles

| Agent profile | Preferred discovered Gemini tier | Escalation | Temperature | Maximum output tokens | Prompt version |
| --- | --- | --- | --- | --- | --- |
| `understanding` | Flash | Pro on the next configured Gemini key | 0.2 | 4000 | `understanding-v3-evidence-grounded` |
| `categorization` | Flash Lite | Flash on the next configured Gemini key | 0.1 | 2200 | `requirement-categorization-v2-evidence-grounded` |
| `test_cases` | Flash | Pro on the next configured Gemini key | 0.15 | 3000 | `test-cases-v2-traceable` |
| `default` | Flash | None | 0.2 | 2500 | N/A |

`LLMService` discovers supported models with Gemini ListModels rather than relying on a fixed model name. It tries each configured Gemini key using the preferred tier. When a high-tier escalation is required, it rotates the key sequence, so the next configured key is tried before the original key is reused for the Pro tier.

If all Gemini attempts fail, the alternate configured GPT provider is tried. If GPT is the selected provider and its attempts fail, Gemini is tried. Each AI artifact records the final `provider`, `model`, `prompt_version`, and `fallback_used` value. No key values or key identifiers are stored in artifact provenance.

### Active prompt templates

#### Understanding: `understanding-v3-evidence-grounded`

```text
Use only the supplied requirement-document names and source snapshot as evidence.
Do not invent routes, APIs, requirements, source files, or selectors.
Prefer stable [data-testid] selectors.
Return strict JSON containing summary, architecture_notes, testability_observations,
entry_points, components, flows, and gaps.
When output space is limited, prioritize summary, components, flows, then gaps.
```

#### Requirement Categorization: `requirement-categorization-v2-evidence-grounded`

```text
Analyze only the supplied application evidence.
Return strict JSON requirement objects using the closed QET requirement-type enum.
Do not create a requirement without source evidence from the summary, architecture,
component list, or gap list. Preserve concrete source evidence.
```

#### Test Cases: `test-cases-v2-traceable`

```text
Return 10-14 strict JSON test cases spanning Positive, Negative, Boundary,
Validation, and Error-Handling behavior.
Every case must map to supplied requirement evidence or an explicit supplied gap.
Expected results must be observable. Mark automation_candidate false when stable
automation evidence is unavailable. Prioritize critical/high-risk coverage when constrained.
```

### Deterministic-agent boundary

Test Data, Playwright Script Writer, Accessibility, Reporting, and Execution remain model-free. They must remain deterministic so synthetic data, generated scripts, evidence, reports, and safety controls are reproducible and auditable.

### Validation

The routing policy has tests for Flash-to-Pro escalation with next-key rotation, GPT-to-Gemini fallback, prompt-version contracts, JSON parsing, and migrated AI-agent behavior. The tests use mock transport and do not call external AI services.
