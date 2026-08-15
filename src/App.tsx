import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, ZoomIn, ZoomOut, Sparkles, Copy, Check, PanelRightOpen, PanelRightClose, SlidersHorizontal, Square } from 'lucide-react';
import { AISettingsPanel } from './components/AISettingsPanel';
import { RunsDashboard } from './components/RunsDashboard';
import { TabId } from './components/NavigationHeader';
import { HomeUploadPage } from './components/HomeUploadPage';
import { AgentPipelineRail } from './components/AgentPipelineRail';
import { ActiveProcessBar } from './components/ActiveProcessBar';
import { UnderstandingPage } from './components/UnderstandingPage';
import { ExecutionPage } from './components/ExecutionPage';
import { AgentDetailDrawer } from './components/AgentDetailDrawer';
import { ConsoleLogDrawer, LogEntry } from './components/ConsoleLogDrawer';
import { RightLogsPanel } from './components/RightLogsPanel';
import { AISettingsResponse, AppState, RailViewMode, DrawerTabId, DiscoverableModel } from './types';
import { createRun, getAISettings, getRunStatus, getRunFullState, updateAISettings, retryRun, getRunLogs, getBackendLogsDownloadUrl, cancelRun, getDiscoverableModels } from './services/apiClient';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiSettings, setAISettings] = useState<AISettingsResponse | null>(null);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [copiedRunId, setCopiedRunId] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('requirement_understanding');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [railViewMode, setRailViewMode] = useState<RailViewMode>('understanding_focus');
  const [drawerTab, setDrawerTab] = useState<DrawerTabId>('overview');
  const scrolledEventsRef = useRef<Set<string>>(new Set());

  // Console logging state variables
  const [logDrawerOpen, setLogDrawerOpen] = useState<boolean>(true);
  const [uiLogs, setUiLogs] = useState<LogEntry[]>([]);
  const [backendLogs, setBackendLogs] = useState<string>('');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = window.localStorage.getItem('qet-ui-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const stored = window.localStorage.getItem('qet-ui-zoom');
    const parsed = stored ? Number(stored) : 100;
    return Number.isFinite(parsed) && parsed >= 50 && parsed <= 160 ? parsed : 100;
  });

  // UI Event Logging helper
  const logUiEvent = (message: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setUiLogs((prev) => [...prev.slice(-199), { timestamp, message, type }]);
  };

  const clearFrontendLogs = () => setUiLogs([]);

  const downloadFrontendLogs = () => {
    const text = uiLogs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frontend_logs_${appState?.run_id || 'active'}.txt`;
    a.click();
  };

  const downloadBackendLogs = () => {
    const blob = new Blob([backendLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backend_logs_${appState?.run_id || 'active'}.txt`;
    a.click();
  };

  const handleCancelRun = async () => {
    if (!appState?.run_id) return;
    try {
      logUiEvent(`Sending cancel request for run ${appState.run_id}...`, 'info');
      await cancelRun(appState.run_id);
      logUiEvent(`Run ${appState.run_id} stopped successfully.`, 'info');
      await refreshStatus(appState.run_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logUiEvent(`Failed to stop process run: ${msg}`, 'error');
    }
  };

  // Poll backend execution logs when drawer is open and run ID is active
  useEffect(() => {
    const runId = appState?.run_id;
    if (!runId || !logDrawerOpen) return;

    const fetchLogs = async () => {
      try {
        const res = await getRunLogs(runId);
        setBackendLogs(res.backend_logs);
      } catch (err) {
        // silent fail
      }
    };

    void fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [appState?.run_id, logDrawerOpen]);

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

  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 90; // clears the sticky header
    window.scrollTo({ top, behavior: 'smooth' });
  };

  useEffect(() => {
    const currentStatus = appState?.status;
    const runId = appState?.run_id;
    if (!currentStatus || !runId) return;

    const scrollTargets: Record<string, string> = {
      processing_zip: 'zip-intake-panel',
      indexing: 'zip-intake-panel',
      ai_understanding_running: 'understanding-panel',
      understanding_ready: 'understanding-panel',
    };

    const targetId = scrollTargets[currentStatus];
    if (!targetId) return;

    const eventKey = `${runId}:${appState?.reset_generation ?? 1}:${currentStatus}`;
    if (scrolledEventsRef.current.has(eventKey)) return;
    scrolledEventsRef.current.add(eventKey);

    const timer = window.setTimeout(() => scrollToSection(targetId), 250);
    return () => window.clearTimeout(timer);
  }, [appState?.status, appState?.run_id, appState?.reset_generation]);

  useEffect(() => {
    if (!appState?.run_id) return;

    const activeStates = ['uploading', 'processing_zip', 'indexing', 'ai_understanding_running', 'generation_running'];
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
          agent_timeline: res.agent_timeline || prev.agent_timeline,
          subagent_timeline: res.subagent_timeline || prev.subagent_timeline,
          active_agent: res.active_agent || prev.active_agent,
          upcoming_agent: res.upcoming_agent || prev.upcoming_agent,
          reset_generation: res.reset_generation || prev.reset_generation,
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
    scrollToSection('understanding-panel');
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
    { id: 'execution', label: 'Execution' },
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
                  QET Automated Agents
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
              <div className="flex flex-wrap items-center gap-2">
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

                {/* Gemini 3.7 Flash Model Selector */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--qet-text-muted)' }}>
                    Model:
                  </span>
                  <select
                    value={aiSettings?.active_provider === 'gpt' ? 'gpt-4o-mini' : 'gemini-3.7-flash-medium'}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const provider = val.startsWith('gpt') ? 'gpt' : 'gemini';
                      await switchProvider(provider);
                    }}
                    className="bg-transparent text-xs font-semibold cursor-pointer outline-none"
                    style={{ color: 'var(--qet-text-primary)' }}
                  >
                    <option value="gemini-3.7-flash-medium">✦ Gemini 3.7 Flash (Medium)</option>
                    <option value="gemini-3.7-flash-low">✦ Gemini 3.7 Flash (Low)</option>
                    <option value="gemini-3.7-flash-high">✦ Gemini 3.7 Flash (High)</option>
                    <option value="gemini-3.1-flash-lite">✦ Gemini 3.1 Flash Lite</option>
                    <option value="gpt-4o-mini">✦ OpenAI GPT-4o-mini</option>
                  </select>
                </div>

                {/* Header Stop Run Button */}
                <button
                  onClick={handleCancelRun}
                  title="Stop active pipeline execution"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop Run</span>
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

        {/* Main Body with 3-Pane Layout */}
        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
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
            <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 lg:flex-row">
              {/* 1. Left Vertical Rail */}
              <AgentPipelineRail
                appState={appState}
                selectedAgentId={selectedAgentId}
                onSelectAgent={(agentId) => {
                  setSelectedAgentId(agentId);
                  setIsDrawerOpen(true);
                }}
                viewMode={railViewMode}
                onToggleViewMode={setRailViewMode}
              />

              {/* 2. Center Main Workspace */}
              <div className="min-w-0 w-full flex-1">
                {activeTab === 'home' && (
                  <div key={activeTab} className="animate-fade-in-up space-y-6">
                    <HomeUploadPage
                      appState={appState}
                      onRefreshStatus={() => refreshStatus()}
                      onProceedToUnderstanding={scrollToUnderstanding}
                      onCreateNewRun={initRun}
                      onInspectAgent={(agentId) => {
                        setSelectedAgentId(agentId);
                        setIsDrawerOpen(true);
                      }}
                    />

                    {isIntakeReady && (
                      <section id="understanding-panel">
                        <UnderstandingPage
                          appState={appState}
                          onRefreshStatus={() => refreshStatus()}
                          onCancelRun={handleCancelRun}
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

                {activeTab === 'execution' && <ExecutionPage appState={appState} />}

                {activeTab === 'tools' && (
                  <AISettingsPanel onSaved={setAISettings} />
                )}
              </div>

              {/* 3. Right-Side Live Console Logs Inspector */}
              <RightLogsPanel
                frontendLogs={uiLogs}
                backendLogs={backendLogs}
                onClearFrontend={clearFrontendLogs}
                onDownloadFrontend={downloadFrontendLogs}
                onDownloadBackend={downloadBackendLogs}
                activeProvider={aiSettings?.active_provider || 'gemini'}
                activeModel={aiSettings?.runtime_state?.model || 'gemini-3.7-flash'}
              />
            </div>
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


