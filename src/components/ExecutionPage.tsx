import React, { useEffect, useState, useCallback } from 'react';
import {
  AppState,
  ExecutionStatusResponse,
  MultiLevelExecutionReport,
  AITestAnalysisResult,
  ScriptExecutionDetail,
  ScreenshotEvidence,
} from '../types';
import {
  launchExecution,
  getExecutionStatus,
  pauseExecution,
  resumeExecution,
  stopExecution,
  getLatestExecutionResults,
  runAITestAnalysis,
  requestAIScriptModification,
  applyAIScriptFix,
  ApiError,
} from '../services/apiClient';

import { ExecutionControlsToolbar } from './execution/ExecutionControlsToolbar';
import { LivePlaywrightRunner } from './execution/LivePlaywrightRunner';
import { ScreenshotGallery } from './execution/ScreenshotGallery';
import { MultiLevelJsonViewer } from './execution/MultiLevelJsonViewer';
import { AITestIntelligencePanel } from './execution/AITestIntelligencePanel';
import { AIScriptModifierModal } from './execution/AIScriptModifierModal';

interface ExecutionPageProps {
  appState: AppState | null;
}

export const ExecutionPage: React.FC<ExecutionPageProps> = ({ appState }) => {
  const [activeTab, setActiveTab] = useState<'runner' | 'screenshots' | 'multilevel' | 'ai'>('runner');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [nonProduction, setNonProduction] = useState(true);
  const [reviewed, setReviewed] = useState(true);
  const [approved, setApproved] = useState(true);

  const [execution, setExecution] = useState<ExecutionStatusResponse | null>(null);
  const [multiLevelReport, setMultiLevelReport] = useState<MultiLevelExecutionReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AITestAnalysisResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Script modifier modal state
  const [modifierTarget, setModifierTarget] = useState<{
    testCaseId: string;
    scriptFilename: string;
    initialCode: string;
    failureLog?: string;
  } | null>(null);

  const runId = appState?.run_id || '';
  const testCases = appState?.test_suite?.test_cases || [];

  // Default select all test cases if none selected
  useEffect(() => {
    if (testCases.length > 0 && selectedCaseIds.length === 0) {
      setSelectedCaseIds(testCases.map((tc) => tc.case_id));
    }
  }, [testCases]);

  // Load latest execution results & AI analysis on mount if available
  const loadExistingResults = useCallback(async () => {
    if (!runId) return;
    try {
      const results = await getLatestExecutionResults(runId);
      if (results && results.summary) {
        setMultiLevelReport(results);
      }
    } catch {
      // no execution results yet
    }

    if (appState?.ai_test_analysis) {
      setAiAnalysis(appState.ai_test_analysis as AITestAnalysisResult);
    }
  }, [runId, appState?.ai_test_analysis]);

  useEffect(() => {
    loadExistingResults();
  }, [loadExistingResults]);

  // WebSocket Live Streaming & Polling
  useEffect(() => {
    if (!runId || !execution?.execution_id) return;
    const isTerminated = ['passed', 'failed', 'stopped', 'cancelled', 'timed_out', 'not_run'].includes(
      execution.status
    );
    if (isTerminated) {
      // Fetch fresh multi-level results when execution terminates
      loadExistingResults();
      return;
    }

    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocketUrl = `${wsProtocol}//${window.location.host}${baseUrl}/runs/${runId}/executions/${execution.execution_id}/events`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(websocketUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ExecutionStatusResponse;
          setExecution(data);
          if (data.result) {
            loadExistingResults();
          }
        } catch {
          // ignore
        }
      };
      socket.onerror = () => {
        // Fallback to polling
      };
    } catch {
      // Fallback
    }

    const interval = window.setInterval(async () => {
      try {
        const snap = await getExecutionStatus(runId, execution.execution_id);
        setExecution(snap);
        if (snap.result) {
          loadExistingResults();
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => {
      if (socket) socket.close();
      window.clearInterval(interval);
    };
  }, [runId, execution?.execution_id, execution?.status, loadExistingResults]);

  // Execution Handlers
  const handleLaunch = async (caseIds?: string[]) => {
    if (!runId) return;
    setError(null);
    setIsLoading(true);
    const targetIds = caseIds || selectedCaseIds;
    try {
      const snap = await launchExecution(runId, {
        test_case_ids: targetIds.length > 0 ? targetIds : undefined,
        explicit_user_approval: approved,
        is_non_production_confirmed: nonProduction,
        is_script_reviewed: reviewed,
      });
      setExecution(snap);
      setActiveTab('runner');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Could not launch Playwright execution.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!runId || !execution?.execution_id) return;
    try {
      const snap = await pauseExecution(runId, execution.execution_id);
      setExecution(snap);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to pause execution.');
    }
  };

  const handleResume = async () => {
    if (!runId || !execution?.execution_id) return;
    try {
      const snap = await resumeExecution(runId, execution.execution_id);
      setExecution(snap);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to resume execution.');
    }
  };

  const handleStop = async () => {
    if (!runId || !execution?.execution_id) return;
    try {
      const snap = await stopExecution(runId, execution.execution_id);
      setExecution(snap);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to stop execution.');
    }
  };

  const handleRunSingle = (caseId: string) => {
    handleLaunch([caseId]);
  };

  const handleRunSelected = (caseIds: string[]) => {
    handleLaunch(caseIds);
  };

  // AI Intelligence Handlers
  const handleRunAIAnalysis = async () => {
    if (!runId) return;
    setIsAiLoading(true);
    setError(null);
    try {
      const res = await runAITestAnalysis(runId);
      setAiAnalysis(res);
      setActiveTab('ai');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to run AI Test Analysis.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOpenModifier = (testCaseId: string, scriptFilename: string) => {
    // Find initial script code
    let code = '';
    let log = '';
    if (multiLevelReport?.scripts) {
      const match = multiLevelReport.scripts.find((s) => s.test_case_id === testCaseId);
      if (match) {
        code = match.code_snippet || '';
        log = (match.execution_logs || []).join('\n');
      }
    }
    if (!code && appState?.playwright_scripts) {
      const match = appState.playwright_scripts.find((s) => s.test_case_id === testCaseId);
      if (match) code = match.code;
    }
    if (!code) {
      code = `"""Playwright Test Script for ${testCaseId}."""\nimport pytest\nfrom playwright.sync_api import Page, expect\n\ndef test_scenario(page: Page, app_url: str):\n    page.goto(app_url)\n`;
    }

    setModifierTarget({
      testCaseId,
      scriptFilename,
      initialCode: code,
      failureLog: log,
    });
  };

  // Build Case Status Map
  const caseStatusMap: Record<string, 'PASSED' | 'FAILED' | 'RUNNING' | 'NOT_RUN'> = {};
  if (multiLevelReport?.scripts) {
    multiLevelReport.scripts.forEach((s) => {
      caseStatusMap[s.test_case_id] = s.status as any;
    });
  }

  // Aggregate screenshots from multi-level report or fallback
  const screenshots: ScreenshotEvidence[] = multiLevelReport?.screenshots_gallery || [];

  return (
    <section className="flex flex-col gap-6" aria-label="Playwright Execution & Intelligence Studio">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Playwright Test Execution & AI Intelligence Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700">
              Headed Desktop Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute modular test scripts in desktop browser windows, capture positive/negative screenshot evidence, view multi-level JSON diagnostics, and auto-heal scripts with AI.
          </p>
        </div>

        {/* Safety & Environment Pill */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Target Host:</span>
            <strong className="text-slate-200 font-mono">localhost:8501</strong>
          </div>
        </div>
      </div>

      {/* Execution Controls Toolbar */}
      <ExecutionControlsToolbar
        status={execution?.status || 'idle'}
        executionId={execution?.execution_id}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onRunAll={() => handleLaunch()}
        isLoading={isLoading}
      />

      {/* Verification & Gate Checklist Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={nonProduction}
              onChange={(e) => setNonProduction(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Non-production target verified</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Playwright scripts reviewed</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Explicit user execution approval granted</span>
          </label>
        </div>

        <div className="text-slate-500 font-mono">
          {selectedCaseIds.length} of {testCases.length} scripts selected
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">Execution Error:</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('runner')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'runner'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>▶ Live Playwright Runner & Logs</span>
          {execution?.status === 'running' && (
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('screenshots')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'screenshots'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📸 Visual Screenshot Gallery</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {screenshots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('multilevel')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'multilevel'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📊 Multi-Level JSON Report</span>
          {multiLevelReport && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
              {multiLevelReport.summary.pass_rate_percentage}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>✨ AI Test Intelligence & Healing</span>
          {aiAnalysis && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
              Score: {aiAnalysis.overall_health_score}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Live Playwright Runner & Logs */}
      {activeTab === 'runner' && (
        <div className="flex flex-col gap-6">
          <LivePlaywrightRunner
            testCases={testCases}
            selectedCaseIds={selectedCaseIds}
            onToggleSelect={(caseId) =>
              setSelectedCaseIds((prev) =>
                prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
              )
            }
            onSelectAll={(ids) => setSelectedCaseIds(ids)}
            onRunSingle={handleRunSingle}
            onRunSelected={handleRunSelected}
            currentRunningCaseId={execution?.current_test_case_id}
            caseStatusMap={caseStatusMap}
            isLoading={isLoading}
          />

          {/* Live Execution Output Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Pytest Headed Terminal Output
                </span>
              </div>
              {execution?.current_step && (
                <span className="text-xs text-slate-400 italic">
                  Step: {execution.current_step}
                </span>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 min-h-[160px] max-h-72 overflow-auto flex flex-col gap-1">
              {!execution?.logs || execution.logs.length === 0 ? (
                <span className="text-slate-600 italic">
                  Terminal ready. Click "Run All" or "Run Live" on any test case to stream execution output.
                </span>
              ) : (
                execution.logs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                    <span
                      className={
                        line.includes('PASSED')
                          ? 'text-emerald-400'
                          : line.includes('FAILED')
                          ? 'text-rose-400 font-bold'
                          : line.includes('Running command')
                          ? 'text-cyan-400'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Screenshot Gallery */}
      {activeTab === 'screenshots' && (
        <ScreenshotGallery screenshots={screenshots} runId={runId} />
      )}

      {/* Tab 3: Multi-Level JSON Report */}
      {activeTab === 'multilevel' && (
        <MultiLevelJsonViewer
          report={multiLevelReport}
          onModifyScript={(script) => handleOpenModifier(script.test_case_id, script.filename)}
        />
      )}

      {/* Tab 4: AI Intelligence & Auto-Healing */}
      {activeTab === 'ai' && (
        <AITestIntelligencePanel
          analysis={aiAnalysis}
          onRunAnalysis={handleRunAIAnalysis}
          onFixScript={handleOpenModifier}
          isLoading={isAiLoading}
        />
      )}

      {/* AI Script Modifier Modal */}
      {modifierTarget && (
        <AIScriptModifierModal
          testCaseId={modifierTarget.testCaseId}
          scriptFilename={modifierTarget.scriptFilename}
          initialCode={modifierTarget.initialCode}
          failureLog={modifierTarget.failureLog}
          onClose={() => setModifierTarget(null)}
          onRequestModification={async (instruction) => {
            return await requestAIScriptModification(runId, {
              script_filename: modifierTarget.scriptFilename,
              test_case_id: modifierTarget.testCaseId,
              current_code: modifierTarget.initialCode,
              failure_log: modifierTarget.failureLog,
              instruction,
            });
          }}
          onApplyFix={async (modifiedCode) => {
            await applyAIScriptFix(runId, {
              script_filename: modifierTarget.scriptFilename,
              test_case_id: modifierTarget.testCaseId,
              modified_code: modifiedCode,
            });
            loadExistingResults();
          }}
        />
      )}
    </section>
  );
};