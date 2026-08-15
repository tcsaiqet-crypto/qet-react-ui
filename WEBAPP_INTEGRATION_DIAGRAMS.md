# AI Model Integration Architecture Diagram

## 1. Request Flow from Frontend to Backend

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERACTION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  React Frontend (AISettingsPanel.tsx)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  1. User selects provider (Gemini or OpenAI)                   │  │
│  │  2. User enters/pastes API key                                  │  │
│  │  3. Clicks "Verify Keys" button                                │  │
│  │  4. Clicks "Start AI Understanding" for actual execution       │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  HTTP Requests to FastAPI Backend                               │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ POST /api/v1/ai/settings/verify                            │ │  │
│  │  │ {                                                           │ │  │
│  │  │   "gemini_key": "AQ.Ab8...",                               │ │  │
│  │  │   "openai_key": "sk-proj-..."                              │ │  │
│  │  │ }                                                           │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                      OR                                           │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ POST /api/v1/runs/{run_id}/understanding                   │ │  │
│  │  │ {                                                           │ │  │
│  │  │   "requirement_text": "User should filter products by...", │ │  │
│  │  │   "upload_id": "RUN-20260815-..."                          │ │  │
│  │  │ }                                                           │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND (Python)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  fastapi_app.py (Main Entry Point)                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  Route Handlers:                                                │  │
│  │  • verify_ai_settings() → Calls LLMService                      │  │
│  │  • execute_understanding_agent() → Calls Agent                  │  │
│  │  • execute_test_cases_agent() → Calls Agent                     │  │
│  │  • execute_requirement_categorization() → Calls Agent           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  LLMService (src/services/llm_service.py)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  class LLMService:                                              │  │
│  │  ├─ list_gemini_candidates(api_key)                            │  │
│  │  │  └─ HTTP GET /v1beta/models (Gemini API)                   │  │
│  │  │                                                              │  │
│  │  ├─ generate_with_gemini(prompt, api_key)                     │  │
│  │  │  ├─ For each api_key:                                       │  │
│  │  │  │  └─ POST to /v1beta/models/{model}:generateContent      │  │
│  │  │  ├─ Automatic failover to next key if error                │  │
│  │  │  └─ Return (text, attempts)                                 │  │
│  │  │                                                              │  │
│  │  ├─ generate_with_gpt(prompt, api_key)                        │  │
│  │  │  ├─ POST to /v1/chat/completions (OpenAI)                  │  │
│  │  │  ├─ Automatic failover if error                            │  │
│  │  │  └─ Return (text, attempts)                                 │  │
│  │  │                                                              │  │
│  │  └─ generate_text(prompt)  [Smart Routing]                    │  │
│  │     ├─ Get active provider from config                         │  │
│  │     ├─ Try selected provider first                             │  │
│  │     ├─ Fall back to alternative provider                       │  │
│  │     └─ Return text or error                                    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  Agent Execution (backend/src/agents/)                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │  1. UnderstandingAgent                                          │  │
│  │     ├─ Input: Requirements text                                 │  │
│  │     ├─ Calls: llm_service.generate_text(prompt)                │  │
│  │     │         [Uses active provider: Gemini or OpenAI]         │  │
│  │     └─ Output: {understanding_result, entities, patterns}      │  │
│  │                                                                  │  │
│  │  2. RequirementCategorizationAgent                              │  │
│  │     ├─ Input: Understanding result                             │  │
│  │     ├─ Calls: llm_service.generate_text(prompt)                │  │
│  │     └─ Output: {categories, acceptance_criteria}               │  │
│  │                                                                  │  │
│  │  3. TestCasesAgent                                              │  │
│  │     ├─ Input: Requirements                                     │  │
│  │     ├─ Calls: llm_service.generate_text(prompt)                │  │
│  │     └─ Output: [test_id, steps, expected_result, ...]          │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL AI PROVIDER APIS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Google Gemini API                    OpenAI API                       │
│  ┌────────────────────────┐           ┌──────────────────────┐       │
│  │                        │           │                      │       │
│  │  https://generative    │           │  https://api.openai  │       │
│  │  language.googleapis   │           │  .com/v1/chat/...    │       │
│  │  .com/v1beta/models    │           │                      │       │
│  │                        │           │  Available Models:   │       │
│  │  Available Models:     │           │  • gpt-4o            │       │
│  │  • gemini-2.5-pro      │           │  • gpt-4o-mini       │       │
│  │  • gemini-2.0-flash    │           │  • gpt-4-turbo       │       │
│  │  • gemini-1.5-flash    │           │  • gpt-3.5-turbo    │       │
│  │  • deep-research-*     │           │                      │       │
│  │  • [38 total]          │           │  [Variable count]    │       │
│  │                        │           │                      │       │
│  └────────────────────────┘           └──────────────────────┘       │
│           │                                     │                      │
│           ▼                                     ▼                      │
│       Response with                        Response with              │
│       • Generated text                     • Generated text            │
│       • Token usage                        • Token usage               │
│       • Finish reason                      • Finish reason             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESPONSE BACK TO FRONTEND                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HTTP 200 Response                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ {                                                                │  │
│  │   "success": true,                                              │  │
│  │   "run_id": "RUN-20260815-...",                                │  │
│  │   "stage": "understanding",                                     │  │
│  │   "data": {                                                     │  │
│  │     "understanding_result": {...},                             │  │
│  │     "model_used": "gemini-2.0-flash",                          │  │
│  │     "tokens_used": {                                           │  │
│  │       "input": 450,                                            │  │
│  │       "output": 950                                            │  │
│  │     },                                                          │  │
│  │     "execution_time_ms": 2340                                  │  │
│  │   }                                                             │  │
│  │ }                                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  Frontend receives and displays:                                        │
│  ✓ Execution status (success/failure)                                  │
│  ✓ Results with highlighted key entities                              │
│  ✓ Model used and performance metrics                                  │
│  ✓ Progress for next stage in pipeline                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI Provider Selection Flow

```
┌─────────────────────────────────────────────────────┐
│  USER CONFIGURATION                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ Active Provider Selection:                   │  │
│  │ □ Gemini (Default) ← User can change        │  │
│  │ □ OpenAI                                    │  │
│  │                                              │  │
│  │ Gemini API Key: [****]                      │  │
│  │ OpenAI API Key: [****]                      │  │
│  │                                              │  │
│  │ [Verify Keys] [Save]                        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│  STORED IN: config.get_active_provider()            │
│  Persisted in: runtime AI settings JSON             │
└─────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│  AGENT EXECUTION DECISION                           │
│                                                      │
│  During agent execution:                           │
│  1. Check config.get_active_provider()             │
│  2. Get corresponding API keys                     │
│  3. Call llm_service.generate_text(prompt)         │
│     ├─ If provider = "gemini":                     │
│     │  └─ Call llm_service.generate_with_gemini() │
│     │     • Try key[0] → Fail? Try key[1] → ...   │
│     │                                               │
│     ├─ If provider = "gpt":                        │
│     │  └─ Call llm_service.generate_with_gpt()    │
│     │     • Try key[0] → Fail? Try key[1] → ...   │
│     │                                               │
│     └─ Return generated text or error              │
│                                                      │
└─────────────────────────────────────────────────────┘
               │
               ▼
        ┌─────────────┬──────────────────┐
        │             │                  │
        ▼             ▼                  ▼
    SUCCESS       KEY FAILED         NO MODELS
   Use result    Try next key        Use error
   in pipeline   in list             message
```

---

## 3. Test Execution Pipeline

```
USER REQUIREMENTS
┌────────────────────────────────────────────────────┐
│ "As a customer, I want to filter products by      │
│  price, color, and brand with real-time updates" │
└────────────────────────────────────────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │   Stage 1:     │
                 │  UNDERSTANDING │
                 │     AGENT      │
                 └────────────────┘
                 Using: LLMService.generate_text()
                 Model: [Gemini or OpenAI]
                 Output: {entities, patterns, entities_extracted}
                          │
                          ▼
                 ┌────────────────┐
                 │ Stage 2: REQ    │
                 │ CATEGORIZATION  │
                 │     AGENT       │
                 └────────────────┘
                 Using: LLMService.generate_text()
                 Model: [Same provider]
                 Output: {categories, acceptance_criteria}
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Stage 3: ACCESSIBILITY AGENT     │
          │  (No AI needed - WCAG rules)      │
          │  Scans source code for violations │
          └───────────────────────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  Stage 4: TEST │
                 │   CASES AGENT  │
                 └────────────────┘
                 Using: LLMService.generate_text()
                 Model: [Same provider]
                 Input: Categories from Stage 2
                 Output: [test_id, scenario, steps, assertions...]
                          │
                          ▼
          ┌───────────────────────────────────┐
          │ Stage 5: TEST DATA AGENT          │
          │ (No AI needed)                     │
          │ Generates: mock data, fixtures     │
          └───────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │ Stage 6: PLAYWRIGHT AGENT         │
          │ (No AI needed)                     │
          │ Executes: Test cases against app  │
          │ Records: Pass/fail results         │
          └───────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │  Stage 7: REPORT AGENT            │
          │  (No AI needed)                    │
          │  Generates: HTML/PDF report        │
          │  With: metrics, coverage, trends   │
          └───────────────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │   FINAL REPORT READY     │
            │ • Test summary           │
            │ • Coverage metrics       │
            │ • Execution results      │
            │ • Accessibility findings │
            │ • Recommendations        │
            └──────────────────────────┘
```

---

## 4. Multi-Key Failover Strategy

```
AVAILABLE KEYS IN SYSTEM:
─────────────────────────────────────────────────
Gemini:  [Key1] → [Key2] → [Key3]
OpenAI:  [Key1]


EXECUTION FLOW WITH AUTOMATIC FAILOVER:
─────────────────────────────────────────────────

Agent calls: llm_service.generate_text(prompt)
                            │
                ┌───────────┴───────────┐
                │                       │
         Provider=Gemini          Provider=OpenAI
                │                       │
                ▼                       ▼
       list_gemini_candidates()  list_gpt_candidates()
                │                       │
                ▼                       ▼
        Try Key1 (first)         Try Key1 (only)
              │                         │
         ┌────┴─────┐             ┌────┴─────┐
         │           │             │           │
       SUCCESS     FAIL         SUCCESS     FAIL
         │           │             │           │
         ▼           ▼             ▼           ▼
      Return      Try Key2    Return      Return
      Result      (second)    Result      Error
                      │
                   ┌──┴──┐
                   │     │
                 SUCCESS FAIL
                   │     │
                   ▼     ▼
                Return  Try Key3
                Result  (third)
                          │
                       ┌──┴──┐
                       │     │
                     SUCCESS FAIL
                       │     │
                       ▼     ▼
                    Return  Return
                    Result  Error
                          (all keys
                           exhausted)
```

---

## 5. Component Dependencies

```
FRONTEND
┌──────────────────────────────────────────────────────┐
│                                                      │
│  AISettingsPanel.tsx                               │
│  ├─ Imports: React, axios, UI components           │
│  ├─ Calls: POST /api/v1/ai/settings/verify         │
│  ├─ Displays: Provider selection, Key input        │
│  └─ Shows: Available models, Verification status   │
│                                                      │
│  AgentPipelineRail.tsx                             │
│  ├─ Displays: Current agent executing              │
│  ├─ Shows: Subagent names (italicized)             │
│  └─ Updates: On /api/v1/runs/{run_id}/status       │
│                                                      │
└──────────────────────────────────────────────────────┘
                      │
                      │ HTTP
                      ▼
BACKEND
┌──────────────────────────────────────────────────────┐
│                                                      │
│  fastapi_app.py                                    │
│  ├─ /api/v1/ai/settings                           │
│  ├─ /api/v1/ai/settings/verify                    │
│  ├─ /api/v1/runs/{run_id}/understanding           │
│  ├─ /api/v1/runs/{run_id}/test-cases              │
│  └─ /api/v1/runs/{run_id}/status                  │
│       │                                             │
│       ▼                                             │
│  llm_service.py (Imported by all routes)           │
│  ├─ LLMService.__init__()                         │
│  ├─ get_active_provider()                         │
│  ├─ list_gemini_candidates(key)                   │
│  ├─ list_gpt_candidates(key)                      │
│  ├─ generate_with_gemini(prompt, keys)            │
│  ├─ generate_with_gpt(prompt, keys)               │
│  └─ generate_text(prompt) ← [MAIN METHOD]         │
│       │                                             │
│       ▼                                             │
│  config.py                                         │
│  ├─ get_provider_api_keys("gemini"|"gpt")         │
│  ├─ get_active_provider()                         │
│  └─ get_provider_api_key(provider)                │
│       │                                             │
│       ▼                                             │
│  Key Loading (Priority Order)                      │
│  ├─ Runtime settings (if exists)                   │
│  ├─ Environment variables                         │
│  ├─ Key files (keys/*.txt)                        │
│  └─ Backend API folder (backend/api/)             │
│                                                      │
│  Agents (imported by pipeline.py)                 │
│  ├─ understanding_agent.py                        │
│  │  └─ Calls: llm_service.generate_text()         │
│  ├─ requirement_categorization_agent.py           │
│  │  └─ Calls: llm_service.generate_text()         │
│  ├─ test_cases_agent.py                          │
│  │  └─ Calls: llm_service.generate_text()         │
│  └─ [other agents - no AI needed]                │
│                                                      │
└──────────────────────────────────────────────────────┘
                      │
                      │ requests.post()
                      ▼
EXTERNAL APIs
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Google Gemini API                                 │
│  POST https://generativelanguage.googleapis.com/   │
│  └─ v1beta/models/{model}:generateContent          │
│                                                      │
│  OpenAI API                                        │
│  POST https://api.openai.com/                      │
│  └─ v1/chat/completions                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Summary of Key Integration Points

| Component | File | Purpose | Key Method |
|-----------|------|---------|-----------|
| **Frontend** | `src/components/AISettingsPanel.tsx` | AI config UI | POST /verify |
| **Service** | `backend/src/services/llm_service.py` | Provider abstraction | `generate_text()` |
| **Config** | `backend/src/config.py` | Key & provider management | `get_provider_api_keys()` |
| **API** | `backend/src/api/fastapi_app.py` | REST endpoints | `/ai/settings/*` |
| **Understanding** | `backend/src/agents/understanding_agent.py` | Requirement analysis | Uses LLMService |
| **Categorization** | `backend/src/agents/requirement_categorization_agent.py` | Req decomposition | Uses LLMService |
| **Test Cases** | `backend/src/agents/test_cases_agent.py` | Test generation | Uses LLMService |
| **Pipeline** | `backend/src/workflows/pipeline.py` | Stage orchestration | Calls agents sequentially |
