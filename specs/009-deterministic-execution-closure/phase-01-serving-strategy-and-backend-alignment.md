# Phase 01: Serving Strategy and Backend Alignment (G1)
FastAPI root `/` serving strategy:
- Mounts and serves static production build (`dist/`) via `StaticFiles(html=True)`.
- Fallback health check response when `dist/` is not present.
- Preserves Streamlit compatibility in `app.py`.
