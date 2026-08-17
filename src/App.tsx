import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Copy, 
  Check, 
  PanelRightOpen, 
  PanelRightClose, 
  SlidersHorizontal,
  Settings,
  History,
  Terminal
} from 'lucide-react';
import { AISettingsPanel } from './components/AISettingsPanel';
import { RunsDashboard } from './components/RunsDashboard';
import { AgentPipelineRail } from './components/AgentPipelineRail';
import { RightLogsPanel } from './components/RightLogsPanel';

// Workspaces
import { RequirementIntakeWorkspace } from './components/workspace/RequirementIntakeWorkspace';
import { CodebaseIntakeWorkspace } from './components/workspace/CodebaseIntakeWorkspace';
import { RequirementUnderstandingWorkspace } from './components/workspace/RequirementUnderstandingWorkspace';
import { TestCaseWorkspace } from './components/workspace/TestCaseWorkspace';
import { DataGenerationWorkspace } from './components/workspace/DataGenerationWorkspace';
import { TestScriptWorkspace } from './components/workspace/TestScriptWorkspace';
import { ExecuteWorkspace } from './components/workspace/ExecuteWorkspace';
import { DashboardWorkspace } from './components/workspace/DashboardWorkspace';

import { AISettingsResponse, AppState, DiscoverableModel } from './types';
import { 
  createRun, 
  getAISettings, 
  getRunStatus, 
  getRunFullState, 
  updateAISettings, 
  getRunLogs, 
  cancelRun, 
  getDiscoverableModels 
} from './services/apiClient';
import { frontendLogger, LogEntry } from './utils/frontendLogger';

export const App: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('subagent_1a_req_intake');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiSettings, setAISettings] = useState<AISettingsResponse | null>(null);
  const [copiedRunId, setCopiedRunId] = useState(false);
  // Dashboard is only unlocked after the user clicks "Proceed to Dashboard" from Execute
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);

  // Drawers & Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRunsHistoryOpen, setIsRunsHistoryOpen] = useState(false);
  const [isLogsPanelOpen, setIsLogsPanelOpen] = useState(false);

  // Logs
  const [backendLogs, setBackendLogs] = useState<string>('');
  const [frontendLogs, setFrontendLogs] = useState<LogEntry[]>(() => frontendLogger.getHistory());

  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    window.localStorage.setItem('qet-ui-theme', 'light');
  }, []);

  // Subscribe to live frontend logger
  useEffect(() => {
    const unsubscribe = frontendLogger.subscribe((entry) => {
      setFrontendLogs((prev) => [...prev, entry]);
    });
    return unsubscribe;
  }, []);

  const refreshStatus = async (runId: string) => {
    try {
      const full = await getRunFullState(runId);
      setAppState(full.state);
      // Auto-sync selected test cases if empty
      if (selectedCaseIds.length === 0 && full.state?.test_suite?.test_cases?.length) {
        setSelectedCaseIds(full.state.test_suite.test_cases.map((c) => c.case_id));
      }
    } catch {
      // silent
    }
  };

  const fetchBackendLogs = async (runId?: string) => {
    const target = runId || appState?.run_id;
    if (!target) return;
    try {
      const res = await getRunLogs(target);
      if (res?.backend_logs) {
        setBackendLogs(res.backend_logs);
      }
    } catch {
      // silent
    }
  };

  // Initial load: create run and fetch settings
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        frontendLogger.info('[INIT] Fetching AI Provider and Agent configuration...');
        const settings = await getAISettings();
        setAISettings(settings);
        frontendLogger.info(`[CONFIG] Active Provider: ${settings.active_provider || 'Gemini'} | Model: ${settings.runtime_state?.model || 'Auto'}`);

        frontendLogger.info('[RUN] Creating new test execution pipeline session for CFA Digital Journey...');
        const newRun = await createRun('CFA Digital Journey');
        setAppState(newRun.state);
        frontendLogger.info(`[RUN] Session established with Run ID: ${newRun.state.run_id}`);
        setLoading(false);
      } catch (err) {
        frontendLogger.error(`[ERROR] Initialization failed: ${String(err)}`);
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fast 1s polling for backend status and logs during active sessions
  useEffect(() => {
    const runId = appState?.run_id;
    if (!runId) return;
    const interval = setInterval(() => {
      refreshStatus(runId);
      fetchBackendLogs(runId);
    }, 1000);
    return () => clearInterval(interval);
  }, [appState?.run_id]);

  const handleSelectAgent = (agentId: string, fromProceed = false) => {
    // Dashboard can only be navigated to by clicking "Proceed" from Execute, not directly from the rail
    if (agentId === 'dashboard' && !fromProceed && !dashboardUnlocked) {
      frontendLogger.warn('[NAV] Dashboard is locked until the Execute stage is completed via the pipeline.');
      return;
    }
    if (agentId === 'dashboard') {
      setDashboardUnlocked(true);
    }
    setSelectedAgentId(agentId);
    frontendLogger.info(`[NAV] Switched active pipeline view to: ${agentId}`);
  };

  const handleCopyRunId = () => {
    if (appState?.run_id) {
      navigator.clipboard.writeText(appState.run_id);
      setCopiedRunId(true);
      frontendLogger.info(`[CLIPBOARD] Copied Run ID ${appState.run_id} to clipboard.`);
      setTimeout(() => setCopiedRunId(false), 2000);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('qet-ui-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDownloadBackendLogs = () => {
    const blob = new Blob([backendLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backend_logs_${appState?.run_id || 'active'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    frontendLogger.info(`[EXPORT] Downloaded backend execution logs for run ${appState?.run_id}`);
  };

  const handleDownloadFrontendLogs = () => {
    const content = frontendLogs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frontend_logs_${appState?.run_id || 'active'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    frontendLogger.info(`[EXPORT] Downloaded frontend UI logs for run ${appState?.run_id}`);
  };

  const handleClearFrontendLogs = () => {
    frontendLogger.clearHistory();
    setFrontendLogs([]);
    frontendLogger.info('[SYSTEM] Frontend log buffer cleared.');
  };

  // Render workspace based on selectedAgentId
  const renderWorkspace = () => {
    switch (selectedAgentId) {
      case 'subagent_1a_req_intake':
        return (
          <RequirementIntakeWorkspace
            appState={appState}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('subagent_1b_codebase_intake')}
          />
        );
      case 'subagent_1b_codebase_intake':
        return (
          <CodebaseIntakeWorkspace
            appState={appState}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('subagent_1c_understanding')}
          />
        );
      case 'subagent_1c_understanding':
      case 'application_understanding':
        return (
          <RequirementUnderstandingWorkspace
            appState={appState}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('test_case_generation')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        );
      case 'subagent_2a_coverage_planner':
      case 'subagent_2b_batch_generator':
      case 'test_case_generation':
        return (
          <TestCaseWorkspace
            appState={appState}
            selectedCaseIds={selectedCaseIds}
            onSelectCaseIds={(ids) => {
              setSelectedCaseIds(ids);
              frontendLogger.info(`[TEST SUITE] Selected ${ids.length} test scenario(s) for pipeline execution.`);
            }}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('data_generation')}
          />
        );
      case 'data_generation':
        return (
          <DataGenerationWorkspace
            appState={appState}
            selectedCaseIds={selectedCaseIds}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('test_script')}
          />
        );
      case 'test_script':
        return (
          <TestScriptWorkspace
            appState={appState}
            selectedCaseIds={selectedCaseIds}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('execute')}
          />
        );
      case 'execute':
        return (
          <ExecuteWorkspace
            appState={appState}
            selectedCaseIds={selectedCaseIds}
            onSelectCaseIds={setSelectedCaseIds}
            onRefresh={refreshStatus}
            onProceedNext={() => {
              setDashboardUnlocked(true);
              handleSelectAgent('dashboard', true);
            }}
          />
        );
      case 'dashboard':
        return (
          <DashboardWorkspace
            appState={appState}
            selectedCaseIds={selectedCaseIds}
          />
        );
      default:
        return (
          <RequirementIntakeWorkspace
            appState={appState}
            onRefresh={refreshStatus}
            onProceedNext={() => handleSelectAgent('subagent_1b_codebase_intake')}
          />
        );
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[#F4F6F8] text-slate-800 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 1. Left Rail Navigation */}
      <AgentPipelineRail
        appState={appState}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRunsHistory={() => setIsRunsHistoryOpen(true)}
        dashboardUnlocked={dashboardUnlocked}
      />

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8]">
        {/* Header Strip */}
        <header className="h-14 px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider">ACTIVE RUN:</span>
            <button
              onClick={handleCopyRunId}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Click to copy Run ID"
            >
              <span>{appState?.run_id || 'Initializing...'}</span>
              {copiedRunId ? <Check className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* AI Settings Drawer Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-purple-600" />
              <span>AI Settings</span>
            </button>

            {/* Logs Panel Toggle */}
            <button
              onClick={() => setIsLogsPanelOpen(!isLogsPanelOpen)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLogsPanelOpen
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Toggle Live Console Logs Panel"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {renderWorkspace()}
          </div>
        </main>
      </div>

      {/* 3. Right Logs Panel (Collapsible & Live Streaming) */}
      <RightLogsPanel
        frontendLogs={frontendLogs}
        backendLogs={backendLogs}
        onClearFrontend={handleClearFrontendLogs}
        onDownloadFrontend={handleDownloadFrontendLogs}
        onDownloadBackend={handleDownloadBackendLogs}
        activeProvider={aiSettings?.active_provider || 'gemini'}
        activeModel={aiSettings?.runtime_state?.model || 'gemini-2.5-flash'}
        isOpen={isLogsPanelOpen}
        onToggle={() => setIsLogsPanelOpen(!isLogsPanelOpen)}
      />

      {/* 4. AI Settings Panel Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-2xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>AI Provider Settings</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <AISettingsPanel
                onSaved={(newSettings) => {
                  setAISettings(newSettings);
                  frontendLogger.info(`[SETTINGS] AI Settings updated. Provider: ${newSettings.active_provider}`);
                  setIsSettingsOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Runs History Modal */}
      {isRunsHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-4xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Historical Run Executions</span>
              </h3>
              <button
                onClick={() => setIsRunsHistoryOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <RunsDashboard
                onOpenRun={(runId: string) => {
                  refreshStatus(runId);
                  frontendLogger.info(`[RUN] Switched active workspace context to historical run: ${runId}`);
                  setIsRunsHistoryOpen(false);
                }}
                activeRunId={appState?.run_id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
