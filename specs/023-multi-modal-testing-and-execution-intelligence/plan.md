# Architecture & Implementation Plan: Spec-Kit 023

## 1. Multi-Modal Testing Architecture

```
[ Stage 2: Understanding ] ──► [ Stage 3: Test Generation Output Viewer ]
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
     [ Multi-Modal Testing Tabs ]                  [ Interactive Modals ]
     • Tab 1: UI Testing (Playwright)              • PlaywrightScriptModal
     • Tab 2: API Testing (REST)                   • TestDataModal
     • Tab 3: Performance (Latency)
     • Tab 4: Accessibility (WCAG)
               │
               ▼
     [ Stage 4: Live Execution Orchestrator ]
     • Selective Checkboxes [ TC-01, TC-03 ]
     • Pause / Resume / Stop Controls
     • Live Step Logs & Screenshot Capture
               │
               ▼
     [ Stage 5: Executive Report Agent ]
     • Automated GO / NO-GO Quality Gate
     • Download PDF Report (ReportLab)
     • Download HTML Report (Responsive)
```

## 2. Report Endpoint Implementation
```python
@app.get("/api/v1/runs/{run_id}/report/pdf")
async def download_pdf_report(run_id: str):
    pdf_bytes = report_agent.generate_pdf(run_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="qet_report_{run_id}.pdf"'}
    )

@app.get("/api/v1/runs/{run_id}/report/html")
async def download_html_report(run_id: str):
    html_content = report_agent.generate_html(run_id)
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="qet_report_{run_id}.html"'}
    )
```
