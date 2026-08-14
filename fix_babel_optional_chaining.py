from pathlib import Path

path = Path("backend/src/api/fastapi_app.py")
content = path.read_text(encoding="utf-8")
idx = content.find("def serve_gorgeous_react_ui():")

if idx != -1:
    decorator_idx = content.rfind("@app.get", 0, idx)
    clean_content = content[:decorator_idx].strip()
    
    new_endpoint = clean_content + """

@app.get("/", response_class=HTMLResponse)
def serve_gorgeous_react_ui():
    return \"\"\"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QET Agent Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; transition: background-color 0.2s, color 0.2s; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    const API_BASE = '/api/v1';

    function App() {
      const [theme, setTheme] = useState('dark');
      const [runId, setRunId] = useState('');
      const [appState, setAppState] = useState(null);
      const [activeTab, setActiveTab] = useState('home');

      // Drag and Drop active states
      const [isDraggingDocs, setIsDraggingDocs] = useState(false);
      const [isDraggingZip, setIsDraggingZip] = useState(false);

      // Upload success/error feedbacks
      const [statusMsg, setStatusMsg] = useState('');
      const [errorMsg, setErrorMsg] = useState('');
      const [isAnalyzing, setIsAnalyzing] = useState(false);
      const [understanding, setUnderstanding] = useState(null);
      const [errorDiagnostics, setErrorDiagnostics] = useState(null);

      useEffect(() => {
        initRun();
      }, []);

      useEffect(() => {
        if (!runId) return;
        const activeStates = ['uploading', 'processing_zip', 'indexing', 'ai_understanding_running'];
        const currentStatus = appState ? appState.status : '';
        if (appState && activeStates.indexOf(currentStatus) !== -1) {
          const timer = setInterval(() => {
            pollStatus();
          }, 2500);
          return () => clearInterval(timer);
        }
      }, [runId, appState ? appState.status : '']);

      const initRun = async () => {
        try {
          const res = await fetch(API_BASE + '/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_name: 'CFA Digital Journey' })
          });
          const data = await res.json();
          setRunId(data.run_id);
          setAppState(data.state);
          setStatusMsg('Fresh execution run initialized.');
          setErrorMsg('');
          setUnderstanding(null);
          setErrorDiagnostics(null);
        } catch (err) {
          setErrorMsg('Failed to initialize run.');
        }
      };

      const pollStatus = async () => {
        if (!runId) return;
        try {
          const res = await fetch(API_BASE + '/runs/' + runId + '/status');
          const data = await res.json();
          setAppState(prev => {
            const next = prev ? { ...prev } : {};
            next.status = data.state;
            next.progress = data.progress;
            next.error = data.error;
            next.intake_manifest = data.intake_manifest;
            return next;
          });
          if (data.state === 'understanding_ready') {
            fetchUnderstanding();
          }
        } catch (err) {
          console.error(err);
        }
      };

      const fetchUnderstanding = async () => {
        try {
          const res = await fetch(API_BASE + '/runs/' + runId + '/understanding');
          const data = await res.json();
          if (data.status === 'ready') {
            setUnderstanding(data.understanding);
            setErrorDiagnostics(null);
          } else if (data.status === 'failed') {
            setErrorDiagnostics(data);
          }
        } catch (err) {
          console.error(err);
        }
      };

      // Perform Document files upload
      const uploadDocs = async (files) => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        setStatusMsg('Uploading requirement documents...');
        setErrorMsg('');
        try {
          const res = await fetch(API_BASE + '/runs/' + runId + '/documents', { method: 'POST', body: formData });
          const data = await res.json();
          setStatusMsg('Successfully uploaded ' + data.uploaded_count + ' requirement file(s).');
          pollStatus();
        } catch (err) {
          setErrorMsg('Failed to upload requirement documents.');
        }
      };

      // Perform Codebase ZIP upload
      const uploadZip = async (file) => {
        if (!file.name.endsWith('.zip')) {
          setErrorMsg('Invalid file format. Please upload a .zip file.');
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        setStatusMsg('Uploading and extracting codebase ZIP...');
        setErrorMsg('');
        try {
          const res = await fetch(API_BASE + '/runs/' + runId + '/codebase', { method: 'POST', body: formData });
          const data = await res.json();
          setStatusMsg('ZIP uploaded and indexed (' + data.intake_manifest.total_files + ' files extracted).');
          pollStatus();
        } catch (err) {
          setErrorMsg('Failed to process codebase ZIP.');
        }
      };

      const handleStartUnderstanding = async () => {
        setIsAnalyzing(true);
        setErrorDiagnostics(null);
        try {
          await fetch(API_BASE + '/runs/' + runId + '/understanding/start', { method: 'POST' });
          const interval = setInterval(async () => {
            const res = await fetch(API_BASE + '/runs/' + runId + '/understanding');
            const data = await res.json();
            if (data.status === 'ready') {
              clearInterval(interval);
              setUnderstanding(data.understanding);
              setIsAnalyzing(false);
              pollStatus();
            } else if (data.status === 'failed') {
              clearInterval(interval);
              setErrorDiagnostics(data);
              setIsAnalyzing(false);
              pollStatus();
            }
          }, 1500);
        } catch (err) {
          setIsAnalyzing(false);
          setErrorMsg(err.message);
        }
      };

      const hasManifest = Boolean(appState && appState.intake_manifest);
      const manifest = hasManifest ? appState.intake_manifest : null;
      const isIntakeReady = Boolean(
        manifest && 
        (manifest.total_files > 0 || (manifest.doc_files && manifest.doc_files.length > 0))
      );

      const isDark = theme === 'dark';
      const currentStatus = appState ? appState.status : 'idle';
      const progress = appState ? appState.progress : 0;

      return (
        <div className={"min-h-screen flex flex-col " + (isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
          
          {/* Header */}
          <header className={"sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between backdrop-blur-md " + (isDark ? "bg-slate-950/90 border-slate-800" : "bg-white/95 border-slate-200 shadow-sm")}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">Q</div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">QET Agent Studio</h1>
                <p className={"text-[10px] font-mono " + (isDark ? "text-slate-400" : "text-slate-500")}>React-First spec-kit platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={"text-xs px-3 py-1 rounded-lg border " + (isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Active Run: </span>
                <code className="text-cyan-400 font-bold">{runId || 'Initializing...'}</code>
              </div>
              <button onClick={toggleTheme} className={"p-2 rounded-lg border text-xs font-semibold " + (isDark ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-white border-slate-200 text-indigo-600 shadow-sm")}>
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button onClick={initRun} className="text-xs text-cyan-400 hover:underline font-semibold">Reset Run</button>
            </div>
          </header>

          {/* Navigation Tab Ribbon */}
          <div className={"border-b px-6 py-2 flex space-x-2 text-xs font-semibold overflow-x-auto " + (isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-100/50 border-slate-200")}>
            <button onClick={() => setActiveTab('home')} className={"px-4 py-2 rounded-lg transition-all " + (activeTab === 'home' ? (isDark ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-200') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'))}>
              🏠 1. Home Upload
            </button>
            <button onClick={() => isIntakeReady && setActiveTab('understanding')} disabled={!isIntakeReady} className={"px-4 py-2 rounded-lg transition-all flex items-center space-x-1 " + (activeTab === 'understanding' ? (isDark ? 'bg-purple-950/80 text-purple-300 border border-purple-800' : 'bg-purple-50 text-purple-700 border border-purple-200') : isIntakeReady ? (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850') : 'text-slate-600 opacity-40 cursor-not-allowed')}>
              <span>🧠 2. AI Understanding</span>
              {!isIntakeReady && <span className="text-[10px]">🔒</span>}
            </button>
            {['Test Cases', 'Synthetic Data', 'Playwright Scripts', 'Execution', 'Quality Report'].map((tab, idx) => (
              <button key={idx} disabled className="px-3 py-2 text-slate-500/40 cursor-not-allowed flex items-center space-x-1">
                <span>{tab}</span>
                <span className="text-[10px]">🔒</span>
              </button>
            ))}
          </div>

          {/* Main Content Body */}
          <main className="max-w-6xl mx-auto w-full p-6 flex-1 space-y-6">
            
            {statusMsg && (
              <div className={"p-3 rounded-lg border text-xs flex items-center space-x-2 " + (isDark ? "bg-indigo-950/40 border-indigo-900 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-700")}>
                <span>✨ {statusMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-300 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* Hero Panel */}
                <div className={"border rounded-2xl p-6 space-y-3 " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                  <h2 className="text-xl font-bold">F01 Home Upload Experience</h2>
                  <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>
                    Create a workspace run, upload business requirement documents, and upload codebase ZIP packages. Drag-and-drop zones are active below.
                  </p>
                </div>

                {/* Upload Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Documents Card with Drag and Drop */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingDocs(true); }}
                    onDragLeave={() => setIsDraggingDocs(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingDocs(false);
                      if (e.dataTransfer.files.length) {
                        uploadDocs(Array.from(e.dataTransfer.files));
                      }
                    }}
                    className={"border rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between " + (
                      isDraggingDocs 
                        ? 'border-cyan-400 bg-cyan-950/20' 
                        : (isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')
                    )}
                  >
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-cyan-400">1. Requirement Specifications</h3>
                      <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>Drag & Drop files here, or click upload button below.</p>
                    </div>
                    <label className={"block w-full text-center text-xs font-semibold p-4 border border-dashed rounded-lg cursor-pointer " + (isDark ? "border-slate-700 bg-slate-950/50 hover:bg-slate-950" : "border-slate-300 bg-slate-50 hover:bg-slate-100")}>
                      <span className="text-slate-400">Select Document Files (.md, .pdf, .txt)</span>
                      <input type="file" multiple accept=".md,.pdf,.txt,.docx" onChange={(e) => uploadDocs(Array.from(e.target.files))} className="hidden" />
                    </label>

                    {manifest && manifest.doc_files && manifest.doc_files.length > 0 && (
                      <div className={"p-3 rounded-lg border text-xs font-mono " + (isDark ? "bg-emerald-950/40 border-emerald-900 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-700")}>
                        Docs: {manifest.doc_files.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Codebase ZIP Card with Drag and Drop */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingZip(true); }}
                    onDragLeave={() => setIsDraggingZip(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingZip(false);
                      if (e.dataTransfer.files.length) {
                        uploadZip(e.dataTransfer.files[0]);
                      }
                    }}
                    className={"border rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between " + (
                      isDraggingZip 
                        ? 'border-purple-400 bg-purple-950/20' 
                        : (isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')
                    )}
                  >
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-purple-400">2. Codebase ZIP Archive</h3>
                      <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>Drag & Drop codebase .zip archive here, or click to upload.</p>
                    </div>
                    <label className={"block w-full text-center text-xs font-semibold p-4 border border-dashed rounded-lg cursor-pointer " + (isDark ? "border-slate-700 bg-slate-950/50 hover:bg-slate-950" : "border-slate-300 bg-slate-50 hover:bg-slate-100")}>
                      <span className="text-slate-400">Select ZIP Archive (.zip)</span>
                      <input type="file" accept=".zip" onChange={(e) => uploadZip(e.target.files[0])} className="hidden" />
                    </label>

                    {manifest && manifest.total_files > 0 && (
                      <div className={"p-3 rounded-lg border text-xs font-mono " + (isDark ? "bg-cyan-950/40 border-cyan-900 text-cyan-300" : "bg-cyan-50 border-cyan-100 text-cyan-700")}>
                        Extracted {manifest.total_files} codebase files.
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Progress */}
                <div className={"border rounded-xl p-6 space-y-4 " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Runtime Stage: <code className="text-cyan-400">{currentStatus}</code></span>
                    <span>Progress: {progress}%</span>
                  </div>
                  <div className={"w-full h-2 rounded-full overflow-hidden border " + (isDark ? "bg-slate-900 border-slate-800" : "bg-slate-200 border-slate-300")}>
                    <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-full transition-all duration-300" style={{ width: progress + "%" }}></div>
                  </div>
                </div>

                {/* Next stage CTA */}
                <div className="flex justify-end">
                  <button onClick={() => setActiveTab('understanding')} disabled={!isIntakeReady} className={"px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md " + (isIntakeReady ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02]" : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50")}>
                    Proceed to Understanding Tab →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'understanding' && (
              <div className="space-y-6">
                
                {/* Understading Analysis Trigger */}
                <div className={"border rounded-2xl p-6 flex justify-between items-center " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                  <div>
                    <h2 className="text-xl font-bold">F02 AI-Required Understanding Engine</h2>
                    <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>Generates structured understanding with AI provenance. Fails fast if AI key or model is invalid.</p>
                  </div>
                  <button onClick={handleStartUnderstanding} disabled={isAnalyzing} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-md">
                    {isAnalyzing ? 'Analyzing with AI...' : 'Start AI Analysis'}
                  </button>
                </div>

                {/* Diagnostics / Error Panel */}
                {errorDiagnostics && (
                  <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 space-y-3 text-xs shadow-lg">
                    <h3 className="font-bold text-rose-300 text-sm">❌ AI Fail-Fast Execution Error</h3>
                    <p className="text-rose-200">Error Code: <code className="font-mono text-white font-bold bg-rose-900/50 px-2 py-0.5 rounded border border-rose-800">{errorDiagnostics.error_code}</code></p>
                    <p className="text-rose-200">{errorDiagnostics.error_message}</p>
                    {errorDiagnostics.diagnostics && (
                      <pre className="bg-slate-950 p-3 rounded border border-rose-950 text-rose-300 font-mono text-[11px] overflow-x-auto">{JSON.stringify(errorDiagnostics.diagnostics, null, 2)}</pre>
                    )}
                  </div>
                )}

                {/* AI Provenance Card */}
                {understanding && (
                  <div className="space-y-6">
                    <div className={"border rounded-xl p-5 space-y-2 text-xs " + (isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                      <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">AI Output Provenance Audit</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 font-mono">
                        <div><span className="text-slate-500">Provider:</span> {understanding.provenance ? understanding.provenance.provider : ''}</div>
                        <div><span className="text-slate-500">Model:</span> {(understanding.provenance && understanding.provenance.model) || 'gemini-1.5-flash'}</div>
                        <div><span className="text-slate-500">Fallback Used:</span> <span className="text-indigo-400">{understanding.provenance ? String(understanding.provenance.fallback_used) : 'false'}</span></div>
                        <div><span className="text-slate-500">Validation status:</span> <span className="text-emerald-400">{understanding.validation_status}</span></div>
                      </div>
                    </div>

                    {/* Output Text Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={"border rounded-xl p-5 space-y-2 " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Executive Summary</h4>
                        <p className="text-xs leading-relaxed">{understanding.summary}</p>
                      </div>
                      <div className={"border rounded-xl p-5 space-y-2 " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Architecture Notes</h4>
                        <p className="text-xs leading-relaxed">{understanding.architecture_notes}</p>
                      </div>
                    </div>

                    {/* Component Inventory */}
                    {understanding.components && understanding.components.length > 0 && (
                      <div className={"border rounded-xl p-5 space-y-3 " + (isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Discovered UI Components ({understanding.components.length})</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {understanding.components.map((c, i) => (
                            <div key={i} className={"p-3 rounded-lg border text-xs " + (isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200")}>
                              <span className="font-bold text-indigo-400">{c.name}</span> ({c.type})
                              <p className={"text-[11px] mt-1 " + (isDark ? "text-slate-400" : "text-slate-500")}>{c.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className={"border-t py-6 text-center text-xs " + (isDark ? "border-slate-900 text-slate-600 bg-slate-950" : "border-slate-200 text-slate-500 bg-white shadow-inner")}>
            <p>QET Agent Studio &bull; Spec-Kit 004 Corrective Pass &bull; Antigravity Platform</p>
          </footer>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
\"\"\"
"""
    path.write_text(new_endpoint, encoding="utf-8")
    print("Overwrote successfully without optional chaining.")
else:
    print("Not found")
