import os
import sys
import json
import time
import requests
from io import BytesIO
import zipfile

BASE_URL = "http://127.0.0.1:8080"

def create_sample_zip():
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("src/App.tsx", "import React from 'react';\nexport const App = () => <div><h1>Payment Portal</h1><button id='pay-btn'>Pay Now</button></div>;")
        z.writestr("package.json", '{"name": "payment-app", "version": "1.0.0"}')
    buf.seek(0)
    return buf.getvalue()

def run_e2e():
    print("=== Starting QET End-to-End API Verification ===")
    results = {}
    
    # 1. Health Check
    try:
        r = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        print(f"1. Health Check: {r.status_code} -> {r.json()}")
        results["health_check"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"1. Health Check Failed: {e}")
        results["health_check"] = {"error": str(e)}

    # 2. Discover Models
    try:
        r = requests.get(f"{BASE_URL}/api/v1/ai/models", timeout=5)
        print(f"2. Discover Models: {r.status_code} -> Found {len(r.json().get('models', []))} models")
        results["models_discovery"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"2. Discover Models Failed: {e}")
        results["models_discovery"] = {"error": str(e)}

    # 3. Create New Run
    run_id = None
    try:
        r = requests.post(f"{BASE_URL}/api/v1/runs", timeout=5)
        data = r.json()
        run_id = data.get("run_id")
        print(f"3. Create Run: {r.status_code} -> run_id = {run_id}")
        results["create_run"] = {"status": r.status_code, "run_id": run_id}
    except Exception as e:
        print(f"3. Create Run Failed: {e}")
        results["create_run"] = {"error": str(e)}

    if not run_id:
        print("Aborting remaining tests due to no run_id")
        return results

    # 4. Upload Requirement Document
    try:
        doc_content = """# Payment Gateway Requirement Specification
## 1. Scope
The system shall process credit card payments via Stripe gateway.

## 2. Functional Requirements
- REQ-001: User must enter a 16-digit credit card number.
- REQ-002: System must validate expiration date (MM/YY format).
- REQ-003: System must validate 3-digit CVV.
- REQ-004: If amount exceeds $1000, 2FA OTP verification is required.
"""
        files = {"files": ("payment_specs.md", doc_content.encode("utf-8"), "text/markdown")}
        r = requests.post(f"{BASE_URL}/api/v1/runs/{run_id}/documents", files=files, timeout=10)
        print(f"4. Upload Document: {r.status_code} -> {r.json().get('message')}")
        results["upload_document"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"4. Upload Document Failed: {e}")
        results["upload_document"] = {"error": str(e)}

    # 5. Upload Codebase ZIP
    try:
        zip_bytes = create_sample_zip()
        files = {"file": ("codebase.zip", zip_bytes, "application/zip")}
        r = requests.post(f"{BASE_URL}/api/v1/runs/{run_id}/codebase", files=files, timeout=10)
        print(f"5. Upload Codebase ZIP: {r.status_code} -> {r.json().get('message')}")
        results["upload_codebase"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"5. Upload Codebase ZIP Failed: {e}")
        results["upload_codebase"] = {"error": str(e)}

    # 6. Trigger AI Requirement Understanding
    try:
        r = requests.post(f"{BASE_URL}/api/v1/runs/{run_id}/understanding", timeout=10)
        print(f"6. Trigger AI Understanding: {r.status_code} -> {r.json()}")
        results["trigger_understanding"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"6. Trigger AI Understanding Failed: {e}")
        results["trigger_understanding"] = {"error": str(e)}

    # 7. Poll AI Understanding Status
    print("7. Polling AI Understanding progress...")
    poll_count = 0
    max_polls = 25
    understanding_done = False
    while poll_count < max_polls:
        time.sleep(2)
        poll_count += 1
        try:
            r = requests.get(f"{BASE_URL}/api/v1/runs/{run_id}/status", timeout=5)
            status_data = r.json()
            st = status_data.get("status")
            progress = status_data.get("progress")
            print(f"   [Poll #{poll_count}] Status: {st}, Progress: {progress}%")
            if st == "understanding_ready" or st == "pipeline_complete":
                understanding_done = True
                print("   AI Understanding completed successfully!")
                results["poll_understanding"] = {"status": "success", "final_status": st, "polls": poll_count}
                break
            elif st == "error":
                print(f"   AI Understanding error: {status_data.get('last_error')}")
                results["poll_understanding"] = {"status": "error", "error": status_data.get('last_error')}
                break
        except Exception as e:
            print(f"   Polling exception: {e}")

    # 8. Check Requirement Coverage & Discovered State
    try:
        r = requests.get(f"{BASE_URL}/api/v1/runs/{run_id}/coverage", timeout=5)
        print(f"8. Requirement Coverage: {r.status_code} -> items = {len(r.json().get('items', []))}")
        results["coverage"] = {"status": r.status_code, "items_count": len(r.json().get('items', []))}
    except Exception as e:
        print(f"8. Requirement Coverage Failed: {e}")
        results["coverage"] = {"error": str(e)}

    # 9. Test Backend Run Logs Download
    try:
        r = requests.get(f"{BASE_URL}/api/v1/runs/{run_id}/logs/backend", timeout=5)
        log_sample = r.text[:200]
        print(f"9. Backend Logs Download: {r.status_code} -> Size: {len(r.text)} bytes")
        results["backend_logs"] = {"status": r.status_code, "size_bytes": len(r.text), "preview": log_sample}
    except Exception as e:
        print(f"9. Backend Logs Download Failed: {e}")
        results["backend_logs"] = {"error": str(e)}

    # 10. Test Cancel Run Endpoint
    try:
        r = requests.post(f"{BASE_URL}/api/v1/runs/{run_id}/cancel", timeout=5)
        print(f"10. Cancel Run: {r.status_code} -> {r.json()}")
        results["cancel_run"] = {"status": r.status_code, "data": r.json()}
    except Exception as e:
        print(f"10. Cancel Run Failed: {e}")
        results["cancel_run"] = {"error": str(e)}

    # Save summary report
    with open("temp/e2e_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\n=== E2E Test Execution Completed. Summary saved to temp/e2e_results.json ===")
    return results

if __name__ == "__main__":
    run_e2e()
