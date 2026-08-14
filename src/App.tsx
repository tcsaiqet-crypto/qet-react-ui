import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, ZoomIn, ZoomOut, Sparkles, Copy, Check } from 'lucide-react';
import { AISettingsPanel } from './components/AISettingsPanel';
import { RunsDashboard } from './components/RunsDashboard';
import { TabId } from './components/NavigationHeader';
import { HomeUploadPage } from './components/HomeUploadPage';
import { UnderstandingPage } from './components/UnderstandingPage';
import { AISettingsResponse, AppState } from './types';
import { createRun, getAISettings, getRunStatus, getRunFullState, updateAISettings } from './services/apiClient';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiSettings, setAISettings] = useState<AISettingsResponse | null>(null);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [copiedRunId, setCopiedRunId] = useState(false);
  const prevStatusRef = useRef<string>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = window.localStorage.getItem('qet-ui-theme');
    return stored === 'dark' ? 'dark' : 'light';
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

    if (currentStatus === 'ai_understanding_running' && previousStatus !== 'ai_understanding_running') {
      setTimeout(() => {
        document.getElementById('understanding-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [appState?.status]);

  useEffect(() => {
    if (!appState?.run_id) return;

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
    try {
      setLoading(true);
      const res = await getRunFullState(runId);
      setAppState(res.state);
    } catch (err) {
      console.error('Failed to open run full state:', err);
      await refreshStatus(runId);
    } finally {
      setLoading(false);
      setActiveTab('home');
    }
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

  const copyRunId = () => {
    if (!appState?.run_id) return;
    navigator.clipboard.writeText(appState.run_id);
    setCopiedRunId(true);
    setTimeout(() => setCopiedRunId(false), 2000);
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'runs', label: 'Runs' },
    { id: 'tools', label: 'Tools' },
  ];

  return (
    <div
      className="min-h-screen font-sans antialiased"
      data-theme={theme}
      style={{
        backgroundColor: 'var(--qet-page-bg)',
        color: 'var(--qet-page-fg)',
        zoom: `${zoomLevel}%`,
      }}
    >
      <div className="min-h-screen flex flex-col">
        {/* Navigation Header Bar */}
        <header
          className="sticky top-0 z-40 border-b px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 transition-colors"
          style={{
            backgroundColor: 'var(--qet-header-bg)',
            borderColor: 'var(--qet-header-border)',
          }}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1.4fr] lg:items-center">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--qet-accent)' }} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight" style={{ color: 'var(--qet-text-primary)' }}>
                  QET Agent
                </h1>
                <p className="truncate text-xs font-medium" style={{ color: 'var(--qet-text-muted)' }}>
                  Autonomous Quality Execution Platform
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center justify-start gap-1.5 lg:justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                      isActive ? 'qet-badge-accent shadow-sm' : ''
                    }`}
                    style={
                      !isActive
                        ? {
                            color: 'var(--qet-text-secondary)',
                            backgroundColor: 'transparent',
                          }
                        : undefined
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Right Controls: AI Provider, Runtime, Theme, Zoom */}
            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              {/* AI Provider Switcher */}
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
              >
                <button
                  onClick={() => switchProvider('gemini')}
                  disabled={switchingProvider}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    aiSettings?.active_provider === 'gemini'
                      ? 'qet-btn-primary shadow-xs'
                      : 'text-xs hover:opacity-100'
                  }`}
                  style={aiSettings?.active_provider !== 'gemini' ? { color: 'var(--qet-text-muted)' } : undefined}
                >
                  Gemini
                </button>
                <button
                  onClick={() => switchProvider('gpt')}
                  disabled={switchingProvider}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    aiSettings?.active_provider === 'gpt'
                      ? 'qet-btn-primary shadow-xs'
                      : 'text-xs hover:opacity-100'
                  }`}
                  style={aiSettings?.active_provider !== 'gpt' ? { color: 'var(--qet-text-muted)' } : undefined}
                >
                  OpenAI
                </button>
              </div>

              {/* Runtime Badge */}
              {aiSettings && (
                <div
                  className="flex flex-col items-start px-2.5 py-1 text-[11px] leading-tight rounded-lg lg:items-end"
                  style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
                >
                  <span className="uppercase tracking-wider font-semibold text-[9px]" style={{ color: 'var(--qet-text-muted)' }}>
                    Runtime
                  </span>
                  <span className="font-mono font-bold text-[11px]" style={{ color: 'var(--qet-accent)' }}>
                    {aiSettings.runtime_state.provider} &middot; {aiSettings.runtime_state.state}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--qet-text-secondary)' }}>
                    Model: {aiSettings.runtime_state.model || 'Auto'}
                  </span>
                </div>
              )}

              {/* Theme Toggle (Light / Dark) */}
              <button
                onClick={toggleTheme}
                className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              {/* Zoom Controls */}
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
              >
                <button
                  onClick={() => adjustZoom(-10)}
                  title="Zoom Out"
                  className="rounded-md px-1.5 py-1 text-xs transition-colors hover:opacity-75"
                  style={{ color: 'var(--qet-text-secondary)' }}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  title="Reset Zoom (100%)"
                  className="rounded-md px-2 py-1 text-[11px] font-bold font-mono"
                  style={{ color: 'var(--qet-accent)' }}
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={() => adjustZoom(10)}
                  title="Zoom In"
                  className="rounded-md px-1.5 py-1 text-xs transition-colors hover:opacity-75"
                  style={{ color: 'var(--qet-text-secondary)' }}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Run Sub-bar */}
          {appState?.run_id && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5"
              style={{ borderColor: 'var(--qet-border)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg"
                style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--qet-text-muted)' }}>
                  Active Run:
                </span>
                <code
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--qet-accent)',
                    backgroundColor: 'var(--qet-surface)',
                    border: '1px solid var(--qet-border)',
                  }}
                >
                  {appState.run_id}
                </code>
                <button
                  onClick={copyRunId}
                  title="Copy Run ID"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  style={{ color: 'var(--qet-text-muted)' }}
                >
                  {copiedRunId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <button
                onClick={initRun}
                className="text-xs font-semibold transition-colors hover:underline"
                style={{ color: 'var(--qet-accent)' }}
              >
                + New Run
              </button>
            </div>
          )}
        </header>

        {/* Main Body */}
        <main className="mx-auto max-w-7xl flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div
                className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--qet-accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-muted)' }}>
                Initializing QET Agent Workspace...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="space-y-6">
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

        {/* Clean Footer */}
        <footer
          className="border-t py-4 text-center text-xs transition-colors"
          style={{
            borderColor: 'var(--qet-border)',
            backgroundColor: 'var(--qet-surface)',
            color: 'var(--qet-text-muted)',
          }}
        >
          <p>QET AI Execution Engine &bull; Enterprise Quality Platform &bull; React UI</p>
        </footer>
      </div>
    </div>
  );
};

