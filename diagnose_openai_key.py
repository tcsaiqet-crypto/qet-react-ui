"""Diagnose why the OpenAI key returns no usable models."""

import pathlib

import requests

KEY_FILE = pathlib.Path(__file__).parent / "keys" / "openai keys.txt"
raw = KEY_FILE.read_text(encoding="utf-8")
key = raw.strip()

print("=== KEY SHAPE ===")
print("raw_length      :", len(raw))
print("stripped_length :", len(key))
print("prefix          :", key[:8])
print("suffix          :", key[-6:])
print("inner_whitespace:", any(c.isspace() for c in key))
print("line_count      :", len(raw.splitlines()))

print("\n=== GET /v1/models ===")
r = requests.get(
    "https://api.openai.com/v1/models",
    headers={"Authorization": f"Bearer {key}"},
    timeout=20,
)
print("status:", r.status_code)
if r.status_code == 200:
    ids = [m["id"] for m in r.json().get("data", [])]
    print("total models:", len(ids))
    print("gpt-ish ids :", sorted(i for i in ids if "gpt" in i.lower())[:20])
    print("sample ids  :", sorted(ids)[:20])
else:
    print(r.text[:1000])

print("\n=== POST /v1/chat/completions (gpt-4o-mini) ===")
r2 = requests.post(
    "https://api.openai.com/v1/chat/completions",
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Reply with OK"}],
        "max_tokens": 5,
    },
    timeout=30,
)
print("status:", r2.status_code)
print(r2.text[:800])
