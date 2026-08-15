import sys
import os
import json
import time
import requests

# Set path to backend
sys.path.insert(0, os.path.abspath("backend"))
sys.path.insert(0, os.path.abspath("backend/src"))

from src.config import config
from src.services.llm_service import LLMService

print("=" * 60)
print("  QET AI MODEL TESTING & DISCOVERY HARNESS")
print("=" * 60)

# 1. Resolve Gemini and GPT Keys
gemini_keys = config.get_provider_api_keys("gemini")
gpt_keys = config.get_provider_api_keys("gpt")

print(f"\n[1] Configured Keys Found:")
print(f"  - Gemini Keys: {len(gemini_keys)} key(s) loaded")
for idx, k in enumerate(gemini_keys):
    masked = k[:8] + "..." + k[-4:] if len(k) > 12 else "***"
    print(f"      Key #{idx+1}: {masked}")

print(f"  - OpenAI Keys: {len(gpt_keys)} key(s) loaded")
for idx, k in enumerate(gpt_keys):
    masked = k[:8] + "..." + k[-4:] if len(k) > 12 else "***"
    print(f"      Key #{idx+1}: {masked}")

if not gemini_keys:
    print("\n[ERROR] No Gemini API keys found in config or keys/ directory.")
    sys.exit(1)

primary_gemini_key = gemini_keys[0]

# 2. Discover available Gemini models via ListModels API
print(f"\n[2] Discovering Available Gemini Models via Google API...")
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={primary_gemini_key}"
try:
    resp = requests.get(list_url, timeout=15)
    if resp.status_code == 200:
        models_data = resp.json().get("models", [])
        gen_models = [
            m.get("name", "").replace("models/", "")
            for m in models_data
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        print(f"  Found {len(gen_models)} models supporting generateContent:")
        for m in sorted(gen_models):
            print(f"    - {m}")
    else:
        print(f"  ListModels returned status {resp.status_code}: {resp.text[:200]}")
except Exception as e:
    print(f"  ListModels request failed: {e}")

# 3. Test Function for Gemini Models and Thinking Budgets
def test_gemini_generation(model_name: str, thinking_budget: int = None, tier_label: str = "Standard"):
    prompt_text = "Generate a JSON object containing a test plan for user login with fields 'scenario', 'steps' (array of strings), and 'expected_result'. Answer with JSON only."
    
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt_text}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048
        }
    }
    
    if thinking_budget is not None and thinking_budget > 0:
        payload["generationConfig"]["thinkingConfig"] = {
            "thinkingBudget": thinking_budget
        }

    print(f"\n--- Testing: {model_name} [{tier_label}] (thinkingBudget={thinking_budget}) ---")
    
    for key_idx, key in enumerate(gemini_keys):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        start_time = time.time()
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=25)
            elapsed = time.time() - start_time
            
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    full_text = "".join(p.get("text", "") for p in parts if "text" in p)
                    thought_parts = [p.get("thought", "") for p in parts if "thought" in p]
                    
                    print(f"  Status: SUCCESS on Key #{key_idx+1} | Latency: {elapsed:.2f}s")
                    if thought_parts:
                        print(f"  Thoughts Captured: {len(thought_parts)} reasoning parts")
                    print(f"  Response Preview ({len(full_text)} chars):")
                    preview = full_text.strip().replace("\n", " ")[:160]
                    print(f"    >> {preview}...")
                    return True, elapsed, full_text
            elif res.status_code in (429, 503) and key_idx + 1 < len(gemini_keys):
                print(f"  Key #{key_idx+1} returned HTTP {res.status_code} (Rate Limit / High Demand). Rotating to Key #{key_idx+2}...")
                time.sleep(0.5)
                continue
            else:
                elapsed = time.time() - start_time
                print(f"  Status: FAILED on Key #{key_idx+1} - HTTP {res.status_code} ({elapsed:.2f}s)")
                print(f"  Detail: {res.text[:200]}")
                return False, elapsed, None
        except Exception as exc:
            elapsed = time.time() - start_time
            if key_idx + 1 < len(gemini_keys):
                print(f"  Key #{key_idx+1} exception: {exc}. Rotating to Key #{key_idx+2}...")
                continue
            print(f"  Status: EXCEPTION - {exc} ({elapsed:.2f}s)")
            return False, elapsed, None
    return False, 0.0, None

# 4. Run Tests on Gemini 3.7 Flash & Different Thinking Tiers
print("\n" + "=" * 60)
print("  TESTING GEMINI 3.7 FLASH TIERS & ALTERNATIVE MODELS")
print("=" * 60)

test_configs = [
    ("gemini-3.7-flash", None, "Default / No Budget"),
    ("gemini-3.7-flash", 1024, "Gemini 3.7 Flash (Low Thinking)"),
    ("gemini-3.7-flash", 4096, "Gemini 3.7 Flash (Medium Thinking)"),
    ("gemini-3.7-flash", 8192, "Gemini 3.7 Flash (High Thinking)"),
    ("gemini-3.6-flash", None, "Gemini 3.6 Flash"),
    ("gemini-3.5-flash", None, "Gemini 3.5 Flash"),
    ("gemini-3.1-flash-lite", None, "Gemini 3.1 Flash Lite"),
    ("gemini-2.5-flash", None, "Gemini 2.5 Flash"),
]

results_table = []

for model, budget, label in test_configs:
    success, latency, output = test_gemini_generation(model, thinking_budget=budget, tier_label=label)
    results_table.append({
        "model": model,
        "label": label,
        "budget": budget,
        "success": success,
        "latency": latency,
        "sample": output[:80] if output else "N/A"
    })

print("\n" + "=" * 60)
print("  FINAL MODEL PERFORMANCE & CAPABILITY SUMMARY")
print("=" * 60)
print(f"{'Model / Tier':<35} | {'Status':<8} | {'Latency':<8} | {'Thinking Budget'}")
print("-" * 65)
for r in results_table:
    status_str = "PASSED" if r["success"] else "FAILED"
    lat_str = f"{r['latency']:.2f}s"
    budget_str = str(r["budget"]) if r["budget"] is not None else "Default"
    print(f"{r['label']:<35} | {status_str:<8} | {lat_str:<8} | {budget_str}")
print("=" * 65)
