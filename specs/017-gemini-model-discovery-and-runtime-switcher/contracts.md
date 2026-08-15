# Contracts: Model Discovery Schemas

```typescript
export interface ModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai';
  recommended_for: 'reasoning' | 'fast_processing' | 'general';
  is_available: boolean;
}

export interface ModelDiscoveryResponse {
  active_model: string;
  active_provider: string;
  models: ModelOption[];
}
```
