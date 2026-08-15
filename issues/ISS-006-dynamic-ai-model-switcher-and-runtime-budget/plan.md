# Architecture & Implementation Plan: ISS-006

## 1. Dynamic Model Management Flow

```
[ Frontend Header Dropdown ]
       │
       ├─ (On Mount) GET /api/v1/ai/models ──► Returns [ Gemini 3.7, Gemini 2.5, GPT-4o ]
       │
       └─ (On Select) POST /api/v1/ai/active-model { "model_id": "gemini-3.7-flash", "budget": 8192 }
              │
              ▼
       [ Backend LLMService ]
              │
              ├─ Updates internal runtime config
              ├─ Injects thinking_budget into generation_config
              └─ Emits log to temp/run_{run_id}.log
```

## 2. Dynamic Discovery Implementation
```python
@app.get("/api/v1/ai/models")
def list_available_models():
    models = [
        {"id": "gemini-3.7-flash", "name": "Gemini 3.7 Flash (Thinking)", "provider": "google", "default_budget": 4096},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "google", "default_budget": 1024},
        {"id": "gpt-4o", "name": "OpenAI GPT-4o", "provider": "openai", "default_budget": 2048},
        {"id": "mock-deterministic", "name": "Local Mock Engine", "provider": "local", "default_budget": 0}
    ]
    return {"models": models, "active": llm_service.get_active_model_id()}
```

## 3. Thinking Budget Parameter Injection
```python
def build_gemini_config(thinking_budget: int):
    return {
        "temperature": 0.2,
        "max_output_tokens": 8192,
        "thinking_config": {
            "thinking_budget": thinking_budget
        } if thinking_budget > 0 else None
    }
```
