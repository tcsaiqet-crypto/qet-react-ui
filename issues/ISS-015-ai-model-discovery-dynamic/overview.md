# ISS-015 · AI Settings — Dynamic Model Discovery & Hardcoded Selector Fix

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: App Header Model Selector + AI Settings Panel

---

## Problem Statement

The model selector `<select>` in `App.tsx` header (line ~490) is **hardcoded** with 5 options:
- `gemini-3.7-flash-medium`
- `gemini-3.7-flash-low`
- `gemini-3.7-flash-high`
- `gemini-3.1-flash-lite`
- `gpt-4o-mini`

But the backend has:
- `GET /api/v1/models/discoverable` — returns live list of available models per provider
- `DiscoverableModel` type already in `types.ts`
- `getDiscoverableModels()` already in `apiClient.ts`

The hardcoded list will break when new models are added and doesn't reflect actual AI provider availability.

---

## Functional Requirements

### FR-015-A: Replace Hardcoded Selector with Dynamic List
In `App.tsx`, replace static `<option>` elements:

```typescript
// Current (bad):
<option value="gemini-3.7-flash-medium">✦ Gemini 3.7 Flash (Medium)</option>
<option value="gpt-4o-mini">✦ OpenAI GPT-4o-mini</option>

// Target (dynamic):
const [discoverableModels, setDiscoverableModels] = useState<DiscoverableModel[]>([]);
// On mount: setDiscoverableModels(await getDiscoverableModels())
// Render: discoverableModels.map(m => <option value={m.model_id}>{m.display_name}</option>)
```

### FR-015-B: AI Settings Panel — Show Model Capabilities
In `AISettingsPanel.tsx`, for each available model show:
- Context window size
- Max output tokens
- Supports vision: Yes/No
- Cost tier: Free / Paid / Premium

### FR-015-C: Provider Health Indicator
In the header model selector area, add a small status dot:
- 🟢 API key valid + model available
- 🟡 API key present but not validated
- 🔴 API key missing or rejected

Source: poll `GET /api/v1/settings/ai` every 30 seconds for `provider_healthy` field.

### FR-015-D: Model Switching — Show Confirmation if Run in Progress
If a run is active (status = `generation_running`), show:
> "Switching models mid-run may cause inconsistent results. Switch anyway?"

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/App.tsx` | Replace hardcoded model options with `discoverableModels` state |
| `src/components/AISettingsPanel.tsx` | Add capabilities table, provider health dot |
| `src/services/apiClient.ts` | `getDiscoverableModels()` already exists — verify it's called |
