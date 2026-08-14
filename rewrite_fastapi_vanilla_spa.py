from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")

idx = content.find("def serve_gorgeous_react_ui():")
if idx != -1:
    decorator_idx = content.rfind("@app.get", 0, idx)
    clean_content = content[:decorator_idx].strip()
    
    vanilla_spa = clean_content + """

@app.get("/", response_class=HTMLResponse)
def serve_vanilla_spa():
    return \"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QET Agent Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #020617;
      --text-color: #f1f5f9;
      --header-bg: rgba(2, 6, 23, 0.8);
      --header-border: #1e293b;
      --card-bg: #0f172a;
      --card-border: #1e293b;
      --muted-text: #94a3b8;
      --cyan-glow: rgba(6, 182, 212, 0.15);
      --purple-glow: rgba(168, 85, 247, 0.15);
      --tab-active-bg: #1e1b4b;
      --tab-active-text: #c084fc;
      --tab-active-border: #682773;
    }
    
    .light {
      --bg-color: #f8fafc;
      --text-color: #0f172a;
      --header-bg: rgba(255, 255, 255, 0.9);
      --header-border: #e2e8f0;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --muted-text: #64748b;
      --cyan-glow: rgba(6, 182, 212, 0.05);
      --purple-glow: rgba(168, 85, 247, 0.05);
      --tab-active-bg: #eff6ff;
      --tab-active-text: #1d4ed8;
      --tab-active-border: #bfdbfe;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      transition: background-color 0.2s, color 0.2s;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--header-border);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-badge {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }

    .header-title h1 {
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(to right, #22d3ee, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-title p {
      font-size: 0.65rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--muted-text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .run-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 0.5rem;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      font-family: 'JetBrains Mono', monospace;
    }

    .run-badge span { color: var(--muted-text); }
    .run-badge code { color: #22d3ee; font-weight: 700; }

    .theme-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: var(--card-bg);
      color: var(--text-color);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .theme-btn:hover {
      opacity: 0.9;
    }

    .tab-ribbon {
      border-bottom: 1px solid var(--header-border);
      background-color: var(--header-bg);
      padding: 0.5rem 1.5rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }

    .tab-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted-text);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background-color: var(--tab-active-bg);
      color: var(--tab-active-text);
      border-color: var(--tab-active-border);
    }

    .tab-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    main {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .toast {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #1e1b4b;
      background-color: #0c0a09;
      color: #a78bfa;
      font-size: 0.75rem;
      display: none;
    }

    .toast.error {
      background-color: #450a0a;
      border-color: #7f1d1d;
      color: #fca5a5;
    }

    .hero-panel {
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .hero-panel h2 { font-size: 1.25rem; font-weight: 700; }
    .hero-panel p { font-size: 0.75rem; color: var(--muted-text); }

    .upload-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .upload-grid { grid-template-columns: 1fr 1fr; }
    }

    .upload-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s;
    }

    .upload-card.dragging {
      border-color: #22d3ee;
      background-color: var(--cyan-glow);
    }

    .card-info h3 { font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem; }
    .card-info.docs h3 { color: #22d3ee; }
    .card-info.zip h3 { color: #a78bfa; }
    .card-info p { font-size: 0.75rem; color: var(--muted-text); }

    .drop-zone-label {
      display: block;
      width: 100%;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2rem 1rem;
      border: 1px dashed var(--card-border);
      border-radius: 0.5rem;
      cursor: pointer;
      background-color: rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    }

    .drop-zone-label:hover {
      background-color: rgba(0, 0, 0, 0.25);
    }

    .file-input { display: none; }

    .file-badge-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-badge {
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: rgba(0,0,0,0.2);
    }

    .progress-panel {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .progress-bar-bg {
      width: 100%;
      height: 0.5rem;
      border-radius: 0.25rem;
      background-color: rgba(0,0,0,0.3);
      border: 1px solid var(--card-border);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(to right, #06b6d4, #6366f1, #a855f7);
      width: 0%;
      transition: width 0.3s;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      border: none;
      background: linear-gradient(to right, #06b6d4, #8b5cf6);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    footer {
      border-top: 1px solid var(--header-border);
      padding: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted-text);
      background-color: var(--card-bg);
    }

    section { display: none; flex-direction: column; gap: 1.5rem; }
    section.active { display: flex; }

    /* AI Understanding styles */
    .diagnostics-box {
      background-color: rgba(69, 10, 10, 0.4);
      border: 1px solid #991b1b;
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.75rem;
    }

    .diagnostics-box h3 { color: #fca5a5; font-size: 0.875rem; }
    .diagnostics-box code { background-color: rgba(0,0,0,0.3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; color: white; }
    .diagnostics-box pre { background-color: #020617; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; overflow-x: auto; font-size: 0.7rem; color: #fca5a5; }

    .provenance-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .provenance-card h3 {
      font-size: 0.65rem;
      font-weight: 800;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .provenance-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    @media (min-width: 768px) {
      .provenance-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .text-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .text-grid { grid-template-columns: 1fr 1fr; }
    }

    .text-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .text-card h4 { font-size: 0.75rem; font-weight: 700; color: var(--muted-text); text-transform: uppercase; }
    .text-card p { font-size: 0.75rem; line-height: 1.5; }

    .component-inventory {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .component-inventory h4 { font-size: 0.75rem; font-weight: 700; color: var(--muted-text); text-transform: uppercase; }
    .comp-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 640px) {
      .comp-grid { grid-template-columns: 1fr 1fr; }
    }

    .comp-item {
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: rgba(0,0,0,0.1);
      font-size: 0.75rem;
    }

    .comp-name { font-weight: 700; color: #818cf8; }
    .comp-desc { font-size: 0.7rem; color: var(--muted-text); margin-top: 0.25rem; }
  </style>
</head>
<body>

  <header>
    <div class="header-logo">
      <div class="logo-badge">Q</div>
      <div class="header-title">
        <h1>QET Agent Studio</h1>
        <p>Offline-safe vanilla platform</p>
      </div>
    </div>
    
    <div class="header-actions">
      <div class="run-badge">
        <span>Active Run: </span>
        <code id="active-run-id">Initializing...</code>
      </div>
      <button id="theme-btn" class="theme-btn">☀️ Light</button>
      <button id="reset-run-btn" class="theme-btn" style="color:#06b6d4; border-color:transparent;">Reset Run</button>
    </div>
  </header>

  <div class="tab-ribbon">
    <button id="tab-home-btn" class="tab-btn active">🏠 1. Home Upload</button>
    <button id="tab-understanding-btn" class="tab-btn" disabled>🧠 2. AI Understanding 🔒</button>
    <button class="tab-btn" disabled>Test Cases 🔒</button>
    <button class="tab-btn" disabled>Synthetic Data 🔒</button>
    <button class="tab-btn" disabled>Playwright Scripts 🔒</button>
  </div>

  <main>
    <div id="toast" class="toast">Status update...</div>

    <!-- Section 1: Home Upload -->
    <section id="sect-home" class="active">
      <div class="hero-panel">
        <h2>F01 Home Upload Experience</h2>
        <p>Create a workspace run, upload business requirement documents, and upload codebase ZIP packages. Drag-and-drop zones are active below.</p>
      </div>

      <div class="upload-grid">
        <!-- Docs Upload Card -->
        <div id="drop-docs" class="upload-card">
          <div class="card-info docs">
            <h3>1. Requirement Specifications</h3>
            <p>Drag & Drop files here, or click upload button below.</p>
          </div>
          <label class="drop-zone-label">
            Select Document Files (.md, .pdf, .txt)
            <input type="file" id="file-docs" class="file-input" multiple accept=".md,.pdf,.txt,.docx" />
          </label>
          <div id="doc-files-list" class="file-badge-list"></div>
        </div>

        <!-- ZIP Upload Card -->
        <div id="drop-zip" class="upload-card">
          <div class="card-info zip">
            <h3>2. Codebase ZIP Archive</h3>
            <p>Drag & Drop codebase .zip archive here, or click to upload.</p>
          </div>
          <label class="drop-zone-label">
            Select ZIP Archive (.zip)
            <input type="file" id="file-zip" class="file-input" accept=".zip" />
          </label>
          <div id="zip-files-list" class="file-badge-list"></div>
        </div>
      </div>

      <div class="progress-panel">
        <div class="progress-header">
          <span>Runtime Stage: <code id="stage-label" style="color:#06b6d4;">idle</code></span>
          <span id="progress-percentage">Progress: 0%</span>
        </div>
        <div class="progress-bar-bg">
          <div id="progress-bar-fill" class="progress-bar-fill"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button id="proceed-btn" class="btn-primary" disabled>Proceed to Understanding Tab →</button>
      </div>
    </section>

    <!-- Section 2: AI Understanding -->
    <section id="sect-understanding">
      <div class="hero-panel" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h2>F02 AI-Required Understanding Engine</h2>
          <p>Generates structured understanding with AI provenance. Fails fast if AI key or model is invalid.</p>
        </div>
        <button id="start-analysis-btn" class="btn-primary">Start AI Analysis</button>
      </div>

      <div id="diagnostics-panel" class="diagnostics-box" style="display:none;">
        <h3 id="diag-title">❌ AI Fail-Fast Execution Error</h3>
        <p>Error Code: <code id="diag-code">unknown_error</code></p>
        <p id="diag-msg">Connection failed.</p>
        <pre id="diag-details">{}</pre>
      </div>

      <div id="understanding-results" style="display:none; flex-direction:column; gap:1.5rem;">
        <div class="provenance-card">
          <h3>AI Output Provenance Audit</h3>
          <div class="provenance-grid">
            <div><span style="color:var(--muted-text)">Provider:</span> <span id="prov-provider">gemini</span></div>
            <div><span style="color:var(--muted-text)">Model:</span> <span id="prov-model">gemini-1.5-flash</span></div>
            <div><span style="color:var(--muted-text)">Fallback Used:</span> <span id="prov-fallback" style="color:#818cf8">false</span></div>
            <div><span style="color:var(--muted-text)">Validation:</span> <span id="prov-validation" style="color:#34d399">VALIDATED</span></div>
          </div>
        </div>

        <div class="text-grid">
          <div class="text-card">
            <h4>Executive Summary</h4>
            <p id="result-summary">No summary loaded.</p>
          </div>
          <div class="text-card">
            <h4>Architecture Notes</h4>
            <p id="result-arch">No architecture notes loaded.</p>
          </div>
        </div>

        <div class="component-inventory">
          <h4>Discovered UI Components</h4>
          <div id="result-comps" class="comp-grid"></div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>QET Agent Studio &bull; Spec-Kit 004 Corrective Pass &bull; Antigravity Platform</p>
  </footer>

  <script>
    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      if (document.body.classList.contains('light')) {
        themeBtn.innerText = '🌙 Dark';
      } else {
        themeBtn.innerText = '☀️ Light';
      }
    });

    // Run context variables
    const API_BASE = '/api/v1';
    let runId = '';
    let appState = null;
    let isIntakeReady = false;

    // Toast helpers
    const toast = document.getElementById('toast');
    function showToast(msg, isError = false) {
      toast.innerText = msg;
      toast.style.display = 'block';
      if (isError) {
        toast.classList.add('error');
      } else {
        toast.classList.remove('error');
      }
    }

    // Initialize run ID on page load
    async function initRun() {
      try {
        const res = await fetch(API_BASE + '/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_name: 'CFA Digital Journey' })
        });
        const data = await res.json();
        runId = data.run_id;
        appState = data.state;
        document.getElementById('active-run-id').innerText = runId;
        showToast('Fresh execution run initialized: ' + runId);
        updateProgressUI(0, 'idle');
      } catch (err) {
        showToast('Failed to initialize workspace run.', true);
      }
    }

    // Update Stage & Progress indicators
    function updateProgressUI(progress, status) {
      document.getElementById('stage-label').innerText = status;
      document.getElementById('progress-percentage').innerText = 'Progress: ' + progress + '%';
      document.getElementById('progress-bar-fill').style.width = progress + '%';
    }

    // Status Poller
    async function pollStatus() {
      if (!runId) return;
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/status');
        const data = await res.json();
        
        appState = data;
        updateProgressUI(data.progress, data.state);

        // Update file lists if manifest exists
        if (data.intake_manifest) {
          const manifest = data.intake_manifest;
          
          // Render Docs list
          const docsList = document.getElementById('doc-files-list');
          if (manifest.doc_files && manifest.doc_files.length > 0) {
            docsList.innerHTML = manifest.doc_files.map(f => `<div class="file-badge">📄 ${f}</div>`).join('');
          } else {
            docsList.innerHTML = '';
          }

          // Render ZIP status
          const zipList = document.getElementById('zip-files-list');
          if (manifest.total_files > 0) {
            zipList.innerHTML = `<div class="file-badge" style="border-color:#a78bfa;">📦 ZIP Extracted (${manifest.total_files} files)</div>`;
          } else {
            zipList.innerHTML = '';
          }

          // Check if intake ready
          isIntakeReady = Boolean(manifest.total_files > 0 || (manifest.doc_files && manifest.doc_files.length > 0));
          const proceedBtn = document.getElementById('proceed-btn');
          const tabBtn = document.getElementById('tab-understanding-btn');
          if (isIntakeReady) {
            proceedBtn.removeAttribute('disabled');
            tabBtn.removeAttribute('disabled');
            tabBtn.innerHTML = '🧠 2. AI Understanding';
          } else {
            proceedBtn.setAttribute('disabled', 'true');
            tabBtn.setAttribute('disabled', 'true');
            tabBtn.innerHTML = '🧠 2. AI Understanding 🔒';
          }
        }
      } catch (err) {
        console.error('Poller error:', err);
      }
    }

    // Set polling interval
    setInterval(() => {
      const activeStates = ['uploading', 'processing_zip', 'indexing', 'ai_understanding_running'];
      if (appState && activeStates.indexOf(appState.status) !== -1) {
        pollStatus();
      }
    }, 2000);

    // Tab Navigation
    const tabs = {
      'home': { btn: document.getElementById('tab-home-btn'), sect: document.getElementById('sect-home') },
      'understanding': { btn: document.getElementById('tab-understanding-btn'), sect: document.getElementById('sect-understanding') }
    };

    function switchTab(target) {
      Object.keys(tabs).forEach(k => {
        tabs[k].btn.classList.remove('active');
        tabs[k].sect.classList.remove('active');
      });
      tabs[target].btn.classList.add('active');
      tabs[target].sect.classList.add('active');
    }

    tabs.home.btn.addEventListener('click', () => switchTab('home'));
    tabs.understanding.btn.addEventListener('click', () => switchTab('understanding'));
    document.getElementById('proceed-btn').addEventListener('click', () => switchTab('understanding'));
    document.getElementById('reset-run-btn').addEventListener('click', () => initRun());

    // File Selector & Upload Handlers
    const fileDocs = document.getElementById('file-docs');
    fileDocs.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        uploadDocuments(Array.from(e.target.files));
      }
    });

    const fileZip = document.getElementById('file-zip');
    fileZip.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        uploadCodebaseZip(e.target.files[0]);
      }
    });

    // Upload Documents
    async function uploadDocuments(files) {
      if (!runId) return;
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      showToast('Uploading requirement documents...');
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/documents', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        showToast('Successfully uploaded ' + data.uploaded_count + ' requirement file(s).');
        pollStatus();
      } catch (err) {
        showToast('Failed to upload requirement documents.', true);
      }
    }

    // Upload Codebase ZIP
    async function uploadCodebaseZip(file) {
      if (!runId) return;
      if (!file.name.endsWith('.zip')) {
        showToast('Only ZIP archive formats (.zip) are supported for codebases.', true);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      showToast('Uploading and indexing codebase ZIP package...');
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/codebase', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        showToast('Codebase ZIP uploaded and indexed successfully.');
        pollStatus();
      } catch (err) {
        showToast('Failed to process codebase ZIP upload.', true);
      }
    }

    // Setup Drag-and-Drop Event Listeners
    function setupDragAndDrop(dropAreaId, onFilesDropped) {
      const dropArea = document.getElementById(dropAreaId);
      
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragging');
      });

      dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragging');
      });

      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
          onFilesDropped(e.dataTransfer.files);
        }
      });
    }

    setupDragAndDrop('drop-docs', (files) => uploadDocuments(Array.from(files)));
    setupDragAndDrop('drop-zip', (files) => uploadCodebaseZip(files[0]));

    // AI Analysis Start button handler
    const startBtn = document.getElementById('start-analysis-btn');
    startBtn.addEventListener('click', async () => {
      if (!runId) return;
      startBtn.setAttribute('disabled', 'true');
      startBtn.innerText = 'Analyzing codebase...';
      document.getElementById('diagnostics-panel').style.display = 'none';
      document.getElementById('understanding-results').style.display = 'none';

      try {
        await fetch(API_BASE + '/runs/' + runId + '/understanding/start', { method: 'POST' });
        
        // Poll for AI results
        const interval = setInterval(async () => {
          const res = await fetch(API_BASE + '/runs/' + runId + '/understanding');
          const data = await res.json();
          
          if (data.status === 'ready') {
            clearInterval(interval);
            startBtn.removeAttribute('disabled');
            startBtn.innerText = 'Start AI Analysis';
            renderUnderstanding(data.understanding);
            pollStatus();
          } else if (data.status === 'failed') {
            clearInterval(interval);
            startBtn.removeAttribute('disabled');
            startBtn.innerText = 'Start AI Analysis';
            renderDiagnostics(data);
            pollStatus();
          }
        }, 1500);
      } catch (err) {
        startBtn.removeAttribute('disabled');
        startBtn.innerText = 'Start AI Analysis';
        showToast('Failed to start AI Analysis.', true);
      }
    });

    // Render Diagnostics Errors
    function renderDiagnostics(data) {
      document.getElementById('diagnostics-panel').style.display = 'flex';
      document.getElementById('diag-code').innerText = data.error_code || 'unknown_error';
      document.getElementById('diag-msg').innerText = data.error_message || 'AI engine failed.';
      document.getElementById('diag-details').innerText = JSON.stringify(data.diagnostics || {}, null, 2);
    }

    // Render AI Results
    function renderUnderstanding(und) {
      document.getElementById('understanding-results').style.display = 'flex';
      document.getElementById('prov-provider').innerText = und.provenance ? und.provenance.provider : 'gemini';
      document.getElementById('prov-model').innerText = (und.provenance && und.provenance.model) || 'gemini-1.5-flash';
      document.getElementById('prov-fallback').innerText = und.provenance ? und.provenance.fallback_used : 'false';
      document.getElementById('prov-validation').innerText = und.validation_status || 'VALIDATED';

      document.getElementById('result-summary').innerText = und.summary || 'No summary.';
      document.getElementById('result-arch').innerText = und.architecture_notes || 'No architecture notes.';

      // Components Grid
      const compGrid = document.getElementById('result-comps');
      if (und.components && und.components.length > 0) {
        compGrid.innerHTML = und.components.map(c => `
          <div class="comp-item">
            <span class="comp-name">${c.name}</span> (${c.type})
            <p class="comp-desc">${c.description}</p>
          </div>
        `).join('');
      } else {
        compGrid.innerHTML = '<p style="font-size:0.75rem; color:var(--muted-text)">No components found.</p>';
      }
    }

    // Start execution run on load
    initRun();
  </script>
</body>
</html>
\"\"\"
"""
    path.write_text(vanilla_spa, encoding="utf-8")
    print("Overwrote serve_gorgeous_react_ui with offline-safe vanilla SPA.")
else:
    print("serve_gorgeous_react_ui not found.")
