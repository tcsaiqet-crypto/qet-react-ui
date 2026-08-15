# Plan: Model Discovery & Header Switcher Architecture

## 1. Backend Discovery Endpoint
- In `backend/src/api/fastapi_app.py`, endpoint `GET /api/v1/ai/models` queries `LLMService.get_discoverable_models()`.
- Returns live Gemini models (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`) and OpenAI models (`gpt-4o`, `gpt-4o-mini`).

## 2. Header Switcher Component
- In `src/App.tsx` header, add a quick model selector dropdown next to the provider switch.
- When changed, updates AI settings via `updateAISettings({ model: selectedModel })`.
