"""Simple standalone key checker for Gemini/OpenAI provider credentials.

Usage:
  python check_ai_keys.py
  python check_ai_keys.py --provider gemini
  python check_ai_keys.py --provider gpt
"""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List, Literal

import requests

from src.config import config

Provider = Literal["gemini", "gpt"]

LATEST_OPENAI_MODELS = [
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
]

LATEST_GEMINI_MODELS = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


def _mask_key(key: str) -> str:
    key = (key or "").strip()
    if not key:
        return "<missing>"
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}...{key[-4:]}"


def check_gpt_key(api_key: str, timeout: int = 12) -> Dict[str, Any]:
    if not api_key:
        return {
            "provider": "gpt",
            "ok": False,
            "error_code": "provider_key_missing",
            "error_message": "OpenAI API key is missing.",
        }

    try:
        res = requests.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=timeout,
        )
    except requests.exceptions.Timeout:
        return {
            "provider": "gpt",
            "ok": False,
            "error_code": "request_timeout",
            "error_message": "OpenAI request timed out.",
        }
    except requests.RequestException as exc:
        return {
            "provider": "gpt",
            "ok": False,
            "error_code": "request_error",
            "error_message": f"OpenAI request error: {exc}",
        }

    if res.status_code == 200:
        payload = res.json() if "application/json" in res.headers.get("content-type", "") else {}
        model_count = len(payload.get("data", [])) if isinstance(payload, dict) else 0
        return {
            "provider": "gpt",
            "ok": True,
            "status_code": res.status_code,
            "message": "OpenAI key accepted.",
            "visible_models": model_count,
        }

    preview = (res.text or "")[:300]
    code = "provider_key_missing" if res.status_code in (401, 403) else "provider_request_failed"
    return {
        "provider": "gpt",
        "ok": False,
        "error_code": code,
        "error_message": f"OpenAI request failed with status {res.status_code}.",
        "status_code": res.status_code,
        "response_preview": preview,
    }


def check_gpt_latest_models(api_key: str, timeout: int = 18) -> Dict[str, Any]:
    if not api_key:
        return {
            "provider": "gpt",
            "ok": False,
            "error_code": "provider_key_missing",
            "error_message": "OpenAI API key is missing; cannot test latest models.",
            "attempts": [],
        }

    attempts: List[Dict[str, Any]] = []
    for model in LATEST_OPENAI_MODELS:
        try:
            res = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Respond with OK"}],
                    "max_tokens": 8,
                    "temperature": 0,
                },
                timeout=timeout,
            )
        except requests.exceptions.Timeout:
            attempts.append(
                {
                    "model": model,
                    "ok": False,
                    "error_code": "request_timeout",
                    "error_message": "Timeout while testing model.",
                }
            )
            continue
        except requests.RequestException as exc:
            attempts.append(
                {
                    "model": model,
                    "ok": False,
                    "error_code": "request_error",
                    "error_message": f"Request error: {exc}",
                }
            )
            continue

        if res.status_code == 200:
            attempts.append({"model": model, "ok": True, "status_code": 200})
            return {
                "provider": "gpt",
                "ok": True,
                "message": f"Latest model call succeeded with {model}.",
                "working_model": model,
                "attempts": attempts,
            }

        preview = (res.text or "")[:250]
        code = "provider_key_missing" if res.status_code in (401, 403) else "model_call_failed"
        attempts.append(
            {
                "model": model,
                "ok": False,
                "error_code": code,
                "error_message": f"Status {res.status_code}",
                "status_code": res.status_code,
                "response_preview": preview,
            }
        )

    return {
        "provider": "gpt",
        "ok": False,
        "error_code": attempts[-1]["error_code"] if attempts else "model_call_failed",
        "error_message": "All latest OpenAI model attempts failed.",
        "attempts": attempts,
    }


def check_gemini_key(api_key: str, timeout: int = 12) -> Dict[str, Any]:
    if not api_key:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "provider_key_missing",
            "error_message": "Gemini API key is missing.",
        }

    try:
        res = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            params={"key": api_key},
            timeout=timeout,
        )
    except requests.exceptions.Timeout:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "request_timeout",
            "error_message": "Gemini request timed out.",
        }
    except requests.RequestException as exc:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "request_error",
            "error_message": f"Gemini request error: {exc}",
        }

    if res.status_code == 200:
        payload = res.json() if "application/json" in res.headers.get("content-type", "") else {}
        models = payload.get("models", []) if isinstance(payload, dict) else []
        return {
            "provider": "gemini",
            "ok": True,
            "status_code": res.status_code,
            "message": "Gemini key accepted.",
            "visible_models": len(models),
        }

    preview = (res.text or "")[:300]
    code = "provider_key_missing" if res.status_code in (401, 403) else "model_discovery_failed"
    return {
        "provider": "gemini",
        "ok": False,
        "error_code": code,
        "error_message": f"Gemini model discovery failed with status {res.status_code}.",
        "status_code": res.status_code,
        "response_preview": preview,
    }


def check_gemini_latest_models(api_key: str, timeout: int = 18) -> Dict[str, Any]:
    if not api_key:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "provider_key_missing",
            "error_message": "Gemini API key is missing; cannot test latest models.",
            "attempts": [],
        }

    attempts: List[Dict[str, Any]] = []
    for model in LATEST_GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        try:
            res = requests.post(
                url,
                params={"key": api_key},
                json={
                    "contents": [{"parts": [{"text": "Respond with OK"}]}],
                    "generationConfig": {"temperature": 0, "maxOutputTokens": 8},
                },
                timeout=timeout,
            )
        except requests.exceptions.Timeout:
            attempts.append(
                {
                    "model": model,
                    "ok": False,
                    "error_code": "request_timeout",
                    "error_message": "Timeout while testing model.",
                }
            )
            continue
        except requests.RequestException as exc:
            attempts.append(
                {
                    "model": model,
                    "ok": False,
                    "error_code": "request_error",
                    "error_message": f"Request error: {exc}",
                }
            )
            continue

        if res.status_code == 200:
            attempts.append({"model": model, "ok": True, "status_code": 200})
            return {
                "provider": "gemini",
                "ok": True,
                "message": f"Latest model call succeeded with {model}.",
                "working_model": model,
                "attempts": attempts,
            }

        preview = (res.text or "")[:250]
        code = "provider_key_missing" if res.status_code in (401, 403) else "model_call_failed"
        attempts.append(
            {
                "model": model,
                "ok": False,
                "error_code": code,
                "error_message": f"Status {res.status_code}",
                "status_code": res.status_code,
                "response_preview": preview,
            }
        )

    return {
        "provider": "gemini",
        "ok": False,
        "error_code": attempts[-1]["error_code"] if attempts else "model_call_failed",
        "error_message": "All latest Gemini model attempts failed.",
        "attempts": attempts,
    }


def check_gemini_specific_model(api_key: str, model: str, timeout: int = 18) -> Dict[str, Any]:
    if not api_key:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "provider_key_missing",
            "error_message": "Gemini API key is missing; cannot test specific model.",
            "model": model,
        }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        res = requests.post(
            url,
            params={"key": api_key},
            json={
                "contents": [{"parts": [{"text": "Respond with OK"}]}],
                "generationConfig": {"temperature": 0, "maxOutputTokens": 8},
            },
            timeout=timeout,
        )
    except requests.exceptions.Timeout:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "request_timeout",
            "error_message": "Timeout while testing specific model.",
            "model": model,
        }
    except requests.RequestException as exc:
        return {
            "provider": "gemini",
            "ok": False,
            "error_code": "request_error",
            "error_message": f"Request error: {exc}",
            "model": model,
        }

    if res.status_code == 200:
        return {
            "provider": "gemini",
            "ok": True,
            "message": f"Model call succeeded with {model}.",
            "model": model,
            "status_code": 200,
        }

    preview = (res.text or "")[:350]
    code = "provider_key_missing" if res.status_code in (401, 403) else "model_call_failed"
    return {
        "provider": "gemini",
        "ok": False,
        "error_code": code,
        "error_message": f"Model call failed with status {res.status_code}.",
        "model": model,
        "status_code": res.status_code,
        "response_preview": preview,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Gemini/OpenAI key validity quickly.")
    parser.add_argument("--provider", choices=["gemini", "gpt", "both"], default="both")
    parser.add_argument("--latest-models", action="store_true", help="Also try minimal generation on latest model candidates.")
    parser.add_argument("--gemini-model", default="", help="Test one explicit Gemini model id (example: gemini-3.5-flash).")
    args = parser.parse_args()

    providers = ["gemini", "gpt"] if args.provider == "both" else [args.provider]

    results: Dict[str, Any] = {"checks": []}
    any_failed = False

    for provider in providers:
        key = config.get_provider_api_key(provider)  # runtime settings + env + key files
        summary = {
            "provider": provider,
            "key_present": bool(key),
            "key_masked": _mask_key(key),
            "source": "runtime-settings/env/key-files",
        }

        if provider == "gemini":
            check = check_gemini_key(key)
        else:
            check = check_gpt_key(key)

        merged = {**summary, **check}
        if args.latest_models:
            latest_check = check_gemini_latest_models(key) if provider == "gemini" else check_gpt_latest_models(key)
            merged["latest_model_check"] = latest_check
            merged["ok"] = bool(merged.get("ok", False)) and bool(latest_check.get("ok", False))
        if provider == "gemini" and args.gemini_model.strip():
            specific_check = check_gemini_specific_model(key, args.gemini_model.strip())
            merged["specific_model_check"] = specific_check
            merged["ok"] = bool(merged.get("ok", False)) and bool(specific_check.get("ok", False))
        if not merged.get("ok", False):
            any_failed = True
        results["checks"].append(merged)

    results["overall_ok"] = not any_failed
    print(json.dumps(results, indent=2))
    return 1 if any_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
