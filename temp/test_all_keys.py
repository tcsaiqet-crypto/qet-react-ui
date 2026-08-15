import sys
import os
import requests

sys.path.insert(0, os.path.abspath("backend"))
sys.path.insert(0, os.path.abspath("backend/src"))

from src.config import config

print("=" * 65)
print("  MULTI-KEY POOL HEALTH & CONSUMPTION AUDIT")
print("=" * 65)

gemini_keys = config.get_provider_api_keys("gemini")
gpt_keys = config.get_provider_api_keys("gpt")

print(f"\n[A] Testing All {len(gemini_keys)} Gemini API Keys against gemini-3.7-flash:")
for i, key in enumerate(gemini_keys):
    masked = key[:8] + "..." + key[-4:] if len(key) > 12 else "***"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key={key}"
    try:
        res = requests.post(url, json={"contents": [{"parts": [{"text": "Hello"}]}]}, timeout=10)
        status = res.status_code
        if status == 200:
            result_str = "ACTIVE & WORKING (200 OK)"
        elif status in (429, 503):
            result_str = f"RATE LIMITED / DEMAND SPIKE ({status}) - Rotates to Next Key"
        elif status == 401:
            err_msg = res.json().get("error", {}).get("message", "401 Unauthorized")
            result_str = f"UNAUTHENTICATED ({status}) - {err_msg[:45]}..."
        else:
            result_str = f"HTTP {status}"
    except Exception as e:
        result_str = f"Exception: {e}"
    print(f"  Key #{i+1:02d} [{masked}]: {result_str}")

print(f"\n[B] Testing OpenAI API Key against gpt-4o-mini:")
for i, key in enumerate(gpt_keys):
    masked = key[:8] + "..." + key[-4:] if len(key) > 12 else "***"
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}], "max_tokens": 10}
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        status = res.status_code
        if status == 200:
            result_str = "ACTIVE & WORKING (200 OK)"
        else:
            result_str = f"HTTP {status} ({res.text[:60]})"
    except Exception as e:
        result_str = f"Exception: {e}"
    print(f"  Key #{i+1:02d} [{masked}]: {result_str}")

print("\n" + "=" * 65)
