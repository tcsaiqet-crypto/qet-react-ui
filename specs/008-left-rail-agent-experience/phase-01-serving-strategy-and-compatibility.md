# Phase 01: Serving Strategy and Compatibility (G1)
Align backend root `/` serving strategy:
- Mount and serve static production React build (`dist/`) via `StaticFiles(html=True)`.
- Fall back gracefully to API health check if `dist/` is not yet compiled.
- Preserve Streamlit compatibility in `app.py`.
