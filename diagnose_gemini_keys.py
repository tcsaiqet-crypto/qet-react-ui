"""Diagnose the Gemini ListModels 400 across every configured key."""

import pathlib

import requests

KEY_FILES = [
    "keys/gemini keys.txt",
    "keys/gemini keys 2.txt",
    "keys/gemini keys 3.txt",
    "backend/keys/gemini keys.txt",
    "backend/api/gemapikey1.txt",
]

root = pathlib.Path(__file__).parent

for rel in KEY_FILES:
    path = root / rel
    if not path.exists():
        print(f"\n--- {rel}: MISSING ---")
        continue
    key = path.read_text(encoding="utf-8").strip()
    print(f"\n--- {rel} ---")
    print("len:", len(key), "| prefix:", key[:6], "| suffix:", key[-6:])

    for label, base in (
        ("v1beta", "https://generativelanguage.googleapis.com/v1beta/models"),
        ("v1", "https://generativelanguage.googleapis.com/v1/models"),
    ):
        try:
            r = requests.get(base, params={"key": key}, timeout=20)
        except Exception as exc:
            print(f"  {label} query-param -> EXC {exc}")
            continue
        print(f"  {label} query-param -> {r.status_code}")
        if r.status_code == 200:
            models = r.json().get("models", [])
            gen = [
                m["name"].removeprefix("models/")
                for m in models
                if "generateContent" in (m.get("supportedGenerationMethods") or [])
            ]
            print(f"    total={len(models)} generateContent={len(gen)}")
            print(f"    first 8: {sorted(gen)[:8]}")
        else:
            print("   ", r.text[:400].replace("\n", " "))

    try:
        r = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            headers={"x-goog-api-key": key},
            timeout=20,
        )
        print(f"  v1beta header-auth -> {r.status_code}")
        if r.status_code != 200:
            print("   ", r.text[:400].replace("\n", " "))
    except Exception as exc:
        print("  v1beta header-auth -> EXC", exc)
