import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { AISettingsPanel } from './components/AISettingsPanel';
import { RunsDashboard } from './components/RunsDashboard';
import { TabId } from './components/NavigationHeader';
import { HomeUploadPage } from './components/HomeUploadPage';
import { UnderstandingPage } from './components/UnderstandingPage';
import { AISettingsResponse, AppState } from './types';
import { createRun, getAISettings, getRunStatus, updateAISettings } from './services/apiClient';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiSettings, setAISettings] = useState<AISettingsResponse | null>(null);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const prevStatusRef = useRef<string>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = window.localStorage.getItem('qet-ui-theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const stored = window.localStorage.getItem('qet-ui-zoom');
    const parsed = stored ? Number(stored) : 100;
    return Number.isFinite(parsed) && parsed >= 50 && parsed <= 160 ? parsed : 100;
  });

  useEffect(() => {
    initRun();
    void loadAISettings();
  }, []);

  useEffect(() => {
    window.localStorage.setItem('qet-ui-zoom', String(zoomLevel));
  }, [zoomLevel]);

  useEffect(() => {
    window.localStorage.setItem('qet-ui-theme', theme);
  }, [theme]);

  useEffect(() => {
    const currentStatus = appState?.status;
    if (!currentStatus) return;
    const previousStatus = prevStatusRef.current;
    prevStatusRef.current = currentStatus;

    // Guided autoscroll when AI understanding starts.
    if (currentStatus === 'ai_understanding_running' && previousStatus !== 'ai_understanding_running') {
      setTimeout(() => {
        document.getElementById('understanding-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [appState?.status]);

  useEffect(() => {
    if (!appState?.run_id) return;

    // Poll status periodically when active
    const activeStates = ['uploading', 'processing_zip', 'ai_understanding_running'];
    if (activeStates.includes(appState.status)) {
      const timer = setInterval(() => {
        refreshStatus(appState.run_id);
      }, 2500);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [appState?.run_id, appState?.status]);

  const initRun = async () => {
    setLoading(true);
    try {
      const res = await createRun('CFA Digital Journey');
      setAppState(res.state);
    } catch (err) {
      console.error('Run init failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (runId?: string) => {
    const targetId = runId || appState?.run_id;
    if (!targetId) return;
    try {
      const res = await getRunStatus(targetId);
      setAppState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: res.state,
          progress: res.progress,
          last_error: res.error,
          intake_manifest: res.intake_manifest || prev.intake_manifest,
          stage_timestamps: res.stage_timestamps || prev.stage_timestamps,
          launcher_state: res.launcher_state || prev.launcher_state,
        };
      });
    } catch (err) {
      console.error('Failed to poll status:', err);
    }
  };

  const loadAISettings = async () => {
    try {
      const settings = await getAISettings();
      setAISettings(settings);
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    }
  };

  const switchProvider = async (provider: 'gemini' | 'gpt') => {
    if (switchingProvider || aiSettings?.active_provider === provider) return;
    setSwitchingProvider(true);
    try {
      const settings = await updateAISettings({ active_provider: provider, provider_keys: {} });
      setAISettings(settings);
    } catch (err) {
      console.error('Failed to switch provider:', err);
    } finally {
      setSwitchingProvider(false);
    }
  };

  const openExistingRun = async (runId: string) => {
    await refreshStatus(runId);
    setActiveTab('home');
  };

  const isIntakeReady = Boolean(
    appState?.intake_manifest && 
    (appState.intake_manifest.total_files > 0 || (appState.intake_manifest.doc_files && appState.intake_manifest.doc_files.length > 0))
  );

  const adjustZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(50, Math.min(160, prev + delta)));
  };

  const scrollToUnderstanding = () => {
    document.getElementById('understanding-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'runs', label: 'Runs' },
    { id: 'tools', label: 'Tools' },
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white"
      data-theme={theme}
      style={{ zoom: `${zoomLevel}%` }}
    >
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1.4fr] lg:items-center">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-100">QET Agent</h1>
              <p className="truncate text-xs text-slate-400">Autonomous Quality Execution Platform</p>
            </div>

            <nav className="flex items-center justify-start gap-2 lg:justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <div className="qet-card flex items-center gap-1 p-1">
                <button
                  onClick={() => switchProvider('gemini')}
                  disabled={switchingProvider}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${aiSettings?.active_provider === 'gemini' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-600/40' : 'text-slate-400 hover:text-slate-100'}`}
                >
                  Gemini
                </button>
                <button
                  onClick={() => switchProvider('gpt')}
                  disabled={switchingProvider}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${aiSettings?.active_provider === 'gpt' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-600/40' : 'text-slate-400 hover:text-slate-100'}`}
                >
                  OpenAI
                </button>
              </div>

              {aiSettings && (
                <div className="qet-card flex flex-col items-start px-3 py-2 text-[11px] leading-tight text-slate-400 lg:items-end">
                  <span className="uppercase tracking-wider text-slate-500">Runtime</span>
                  <span className="font-mono text-cyan-300">
                    {aiSettings.runtime_state.provider} · {aiSettings.runtime_state.state}
                  </span>
                  <span className="font-mono text-slate-200">
                    Model: {aiSettings.runtime_state.model || 'Unavailable'}
                  </span>
                </div>
              )}

              <button
                onClick={toggleTheme}
                className="qet-btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-indigo-300" />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>

              <div className="qet-card flex items-center gap-1 p-1">
                <button onClick={() => adjustZoom(-10)} title="Zoom out" className="rounded-md px-1.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-cyan-300"><ZoomOut className="h-3.5 w-3.5" /></button>
                <button onClick={() => setZoomLevel(100)} title="Reset zoom" className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-slate-800">{zoomLevel}%</button>
                <button onClick={() => adjustZoom(10)} title="Zoom in" className="rounded-md px-1.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-cyan-300"><ZoomIn className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>

          {appState?.run_id && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
              <div className="qet-card flex items-center gap-2 px-3 py-2">
                <span className="text-xs text-slate-400 font-medium">Active Run:</span>
                <code className="text-xs font-mono font-semibold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {appState.run_id}
                </code>
              </div>
              <button onClick={initRun} className="text-xs font-medium text-slate-400 underline transition-colors hover:text-cyan-400">New Run</button>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Initializing QET Agent Workspace...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <div className="space-y-8">
                <HomeUploadPage
                  appState={appState}
                  onRefreshStatus={() => refreshStatus()}
                  onProceedToUnderstanding={scrollToUnderstanding}
                  onCreateNewRun={initRun}
                />

                {isIntakeReady && (
                  <section id="understanding-panel">
                    <UnderstandingPage
                      appState={appState}
                      onRefreshStatus={() => refreshStatus()}
                    />
                  </section>
                )}
              </div>
            )}

            {activeTab === 'runs' && (
              <RunsDashboard
                activeRunId={appState?.run_id}
                onOpenRun={(runId) => void openExistingRun(runId)}
              />
            )}

            {activeTab === 'tools' && (
              <AISettingsPanel onSaved={setAISettings} />
            )}
          </>
        )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>QET AI Execution Engine &bull; React-First Delivery &bull; Antigravity Platform</p>
      </footer>
    </div>
  );
};
