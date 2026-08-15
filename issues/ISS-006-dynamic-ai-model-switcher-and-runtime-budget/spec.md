# Specification: ISS-006 — Dynamic AI Model Switcher & Runtime Thinking Budget

## 1. Problem Statement
Previously, changing LLM providers or switching between Gemini 2.5 Flash, Gemini 3.7 Flash, and Thinking Budgets required modifying `.env` files and restarting the FastAPI backend server, disrupting in-flight test runs.

## 2. User Stories
- **US-1**: As an engineer, I want to select the active AI model directly from the UI header dropdown so I can test different reasoning capabilities instantly.
- **US-2**: As a performance tester, I want to configure the thinking token budget (1024, 4096, 8192) to balance generation speed against reasoning depth.
- **US-3**: As a system administrator, I want multi-key automatic rotation so that test runs are resilient against rate-limit bursts.

## 3. Functional Requirements
1. **Model Discovery API**:
   - `GET /api/v1/ai/models`: Returns list of models, providers (`google`, `openai`, `mock`), display names, and capabilities.
2. **Active Model Selection**:
   - `POST /api/v1/ai/active-model`: Updates the active model instance in `LLMService`.
3. **UI Header Switcher**:
   - Renders a styled dropdown with provider badges (`Gemini 3.7 Flash`, `Gemini 2.5 Flash`, `GPT-4o`, `Mock Engine`).
   - Thinking budget pill toggle: `Low (1k)`, `Med (4k)`, `High (8k)`.

## 4. Acceptance Criteria
- [x] Header model dropdown dynamically loads available models from backend.
- [x] Changing model updates subsequent agent prompts without server restart.
- [x] Thinking token parameters are passed directly into Gemini generation configs.
