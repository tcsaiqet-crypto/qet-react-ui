# 004 Gemini Model Discovery and Selection Specification

**Date**: 2026-08-15  
**Timestamp**: 15:44  
**Target Scope**: Model Selection Controls, Dynamic Gemini Model Discovery, API Key Rotation, Provider Fallbacks  

---

## 1. Overview

To provide maximum flexibility and reliable model execution across different workloads (requirement parsing vs code generation vs self-correction), the application requires dynamic **Gemini Model Discovery** and a **Runtime Model Selector**.

---

## 2. Dynamic Model Discovery Engine

### A. API Endpoints & Discovery Heuristics
* Backend endpoint `GET /api/v1/ai/models` returns all available providers and discoverable models.
* Supported Gemini Models:
  - `gemini-2.5-pro` (Recommended for complex reasoning & code generation)
  - `gemini-2.5-flash` (Recommended for fast doc parsing & requirement categorization)
  - `gemini-1.5-pro` (High context window fallback)
  - `gemini-1.5-flash` (Ultra-low latency fallback)

### B. UI Integration (Header & Settings Panel)
1. **Header Toolbar Switcher**: A sleek dropdown in the application header or toolbar allowing users to switch models at runtime (`gemini-2.5-pro`, `gemini-2.5-flash`, `gpt-4o`, etc.).
2. **AI Settings Panel (`AISettingsPanel.tsx`)**:
   - Model Discovery button ("Discover Models") that tests API key connectivity and populates active available models.
   - Provider priority selector (Gemini Primary -> OpenAI Secondary -> Mock Fallback).
   - Multi-key rotation matrix visualization.

---

## 3. Fallback & Resilience Strategy
- **Round-Robin Multi-Key Rotation**: Automatically rotates API keys when rate-limiting (`429 Too Many Requests`) is encountered.
- **Provider Fallback**: If Gemini rate limit persists, automatically fall back to configured secondary models or local deterministic rule engines.
