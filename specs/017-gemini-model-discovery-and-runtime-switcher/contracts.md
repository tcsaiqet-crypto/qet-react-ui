# Contracts: Model Discovery & Gemini 3.7 Flash Thinking Tiers

```typescript
export type GeminiThinkingTier = 'low' | 'medium' | 'high';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai';
  thinking_tier?: GeminiThinkingTier;
  thinking_budget_tokens?: number;
  recommended_for: string;
  is_available: boolean;
}

export interface ModelDiscoveryResponse {
  active_provider: 'gemini' | 'gpt';
  active_model: string;
  active_thinking_tier: GeminiThinkingTier;
  available_models: ModelOption[];
}
```

## 2. Gemini 3.7 Flash Request Payload
When dispatching to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent`:

```json
{
  "contents": [
    {
      "parts": [{ "text": "..." }]
    }
  ],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 8192,
    "thinkingConfig": {
      "thinkingBudget": 4096
    }
  }
}
```
* **Low**: `thinkingBudget: 1024`
* **Medium**: `thinkingBudget: 4096`
* **High**: `thinkingBudget: 16384`
