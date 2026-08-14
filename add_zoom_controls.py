from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")

# 1. Add zoom controls to HTML header actions
old_header_actions = """    <div class="header-actions">
      <div class="run-badge">
        <span>Active Run: </span>
        <code id="active-run-id">Initializing...</code>
      </div>
      <button id="theme-btn" class="theme-btn">☀️ Light</button>
      <button id="reset-run-btn" class="theme-btn" style="color:#06b6d4; border-color:transparent;">Reset Run</button>
    </div>"""

new_header_actions = """    <div class="header-actions">
      <div class="run-badge">
        <span>Active Run: </span>
        <code id="active-run-id">Initializing...</code>
      </div>
      <div style="display: flex; align-items: center; gap: 0.25rem;">
        <button id="zoom-out-btn" class="theme-btn" style="padding: 0.5rem 0.75rem;" title="Zoom Out">🔎➖</button>
        <span id="zoom-val" style="font-size: 0.75rem; font-family: monospace; min-width: 2.5rem; text-align: center;">100%</span>
        <button id="zoom-in-btn" class="theme-btn" style="padding: 0.5rem 0.75rem;" title="Zoom In">🔎➕</button>
      </div>
      <button id="theme-btn" class="theme-btn">☀️ Light</button>
      <button id="reset-run-btn" class="theme-btn" style="color:#06b6d4; border-color:transparent;">Reset Run</button>
    </div>"""

content = content.replace(old_header_actions, new_header_actions)

# 2. Add Zoom script logic
old_js_start = """    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');"""

new_js_zoom = """    // Zoom scaling controls
    let uiScale = 1.0;
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomVal = document.getElementById('zoom-val');

    function updateZoom() {
      document.body.style.zoom = uiScale;
      zoomVal.innerText = Math.round(uiScale * 100) + '%';
    }

    zoomInBtn.addEventListener('click', () => {
      if (uiScale < 1.8) {
        uiScale += 0.1;
        updateZoom();
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (uiScale > 0.6) {
        uiScale -= 0.1;
        updateZoom();
      }
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');"""

content = content.replace(old_js_start, new_js_zoom)

path.write_text(content, encoding="utf-8")
print("Zoom controls added to fastapi_app.py header.")
