"""Exhaustive per-key validation across multiple models and endpoints."""

import pathlib

import requests

ROOT = pathlib.Path(__file__).parent

GEMINI_KEY_FILES = [
    "keys/gemini keys.txt",
    "keys/gemini keys 2.txt",
    "keys/gemini keys 3.txt",
    "backend/keys/gemini keys.txt",
    "backend/api/gemapikey1.txt",
]

GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

OPENAI_KEY_FILES = [
    "keys/openai keys.txt",
    "backend/keys/openai keys.txt",
]

OPENAI_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    "o4-mini",
]


def load(rel):
    p = ROOT / rel
    return p.read_text(encoding="utf-8").strip() if p.exists() else None


print("=" * 78)
print("GEMINI - generateContent across models")
print("=" * 78)
for rel in GEMINI_KEY_FILES:
    key = load(rel)
    if not key:
        print(f"\n{rel}: MISSING")
        continue
    print(f"\n{rel}  (len={len(key)}, {key[:6]}...{key[-6:]})")
    for model in GEMINI_MODELS:
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": key},
                json={
                    "contents": [{"parts": [{"text": "Reply with OK"}]}],
                    "generationConfig": {"temperature": 0, "maxOutputTokens": 8},
                },
                timeout=30,
            )
        except Exception as exc:
            print(f"   {model:<24} EXC {exc}")
            continue
        if r.status_code == 200:
            try:
                txt = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception:
                txt = "<no text>"
            print(f"   {model:<24} 200 OK -> {txt!r}")
        else:
            try:
                msg = r.json()["error"]["message"][:90]
            except Exception:
                msg = r.text[:90]
            print(f"   {model:<24} {r.status_code} {msg}")

print()
print("=" * 78)
print("OPENAI - chat/completions across models")
print("=" * 78)
for rel in OPENAI_KEY_FILES:
    key = load(rel)
    if not key:
        print(f"\n{rel}: MISSING")
        continue
    print(f"\n{rel}  (len={len(key)}, {key[:8]}...{key[-6:]})")
    for model in OPENAI_MODELS:
        try:
            r = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Reply with OK"}],
                    "max_completion_tokens": 8,
                },
                timeout=30,
            )
        except Exception as exc:
            print(f"   {model:<16} EXC {exc}")
            continue
        if r.status_code == 200:
            txt = r.json()["choices"][0]["message"]["content"]
            print(f"   {model:<16} 200 OK -> {txt!r}")
        else:
            try:
                err = r.json()["error"]
                msg = f"{err.get('code')} | {err.get('message', '')[:70]}"
            except Exception:
                msg = r.text[:80]
            print(f"   {model:<16} {r.status_code} {msg}")

    # Non-chat surfaces, to prove it is auth and not model access
    for label, url in (
        ("/v1/responses", "https://api.openai.com/v1/responses"),
        ("/v1/embeddings", "https://api.openai.com/v1/embeddings"),
    ):
        body = (
            {"model": "gpt-4o-mini", "input": "hi"}
            if "responses" in url
            else {"model": "text-embedding-3-small", "input": "hi"}
        )
        try:
            r = requests.post(
                url,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=body,
                timeout=30,
            )
            try:
                code = r.json().get("error", {}).get("code")
            except Exception:
                code = None
            print(f"   {label:<16} {r.status_code} {code}")
        except Exception as exc:
            print(f"   {label:<16} EXC {exc}")
