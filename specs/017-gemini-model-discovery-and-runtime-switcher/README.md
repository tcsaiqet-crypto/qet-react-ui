# Spec-Kit 017: Gemini Model Discovery, Dynamic Selection, and Runtime Key Switcher

## 1. Executive Summary
Spec-Kit 017 introduces dynamic AI model discovery and a persistent header runtime model switcher. Users can discover all available Gemini models (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-1.5-pro`), switch models on the fly during pipeline execution, and utilize multi-key round-robin rotation with graceful deterministic fallback.

---

## 2. Document Directory
- [`spec.md`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/spec.md): Dynamic discovery specs, model parameters, and runtime fallback rules.
- [`plan.md`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/plan.md): Backend model resolution engine and frontend header switcher UI.
- [`contracts.md`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/contracts.md): API request/response types for AI model settings and discovery.
- [`tasks.md`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/tasks.md): Implementation tasks and model verification checklists.
- [`constitution.md`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/constitution.md): Model safety, API key security, and rate-limit mitigation policies.
