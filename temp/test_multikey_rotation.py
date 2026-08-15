import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath("backend"))
sys.path.insert(0, os.path.abspath("backend/src"))

from src.services.llm_service import LLMService

print("=" * 60)
print("  MULTI-KEY ROTATION & GEMINI 3.7 FLASH VERIFICATION")
print("=" * 60)

llm = LLMService()

for i in range(5):
    prompt = f"Run verification test #{i+1}: Return JSON with keys 'test_id': {i+1}, 'model': 'gemini-3.7-flash', 'status': 'operational'."
    start = time.time()
    response = llm.generate_text(prompt, profile="default")
    elapsed = time.time() - start
    
    if response:
        gen_info = llm.last_generation or {}
        key_idx = gen_info.get("key_index", "0")
        model = gen_info.get("model", "unknown")
        print(f"  [Call #{i+1}] PASSED ({elapsed:.2f}s) | Key Index: #{key_idx} | Model: {model}")
        print(f"      >> Content: {response.strip().replace(chr(10), ' ')[:100]}...")
    else:
        print(f"  [Call #{i+1}] FAILED ({elapsed:.2f}s) | Error: {llm.last_error}")

print("=" * 60)
