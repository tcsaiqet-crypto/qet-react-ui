# Constitution 006: Stability Hotfix Non-Negotiables

1. **Clean Runtime Imports**: No circular dependencies or relative path failures across backend services.
2. **Deterministic Fallbacks**: Heuristic fallbacks must produce valid Pydantic models when LLM is unavailable.
3. **No Breaking Schema Changes**: Maintain backward compatibility for existing client consumers.
