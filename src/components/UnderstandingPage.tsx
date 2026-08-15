import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Workflow, 
  ShieldAlert, 
  Cpu, 
  RotateCw,
  Clock,
  Layers,
  ChevronRight,
  Info,
  Square,
  MonitorSmartphone,
  Globe,
  Gauge,
  Accessibility,
  PlayCircle,
  KeyRound,
  Plus,
  ExternalLink,
  X
} from 'lucide-react';
import { AppState, ApplicationUnderstanding } from '../types';
import { startUnderstanding, getUnderstanding, startPipeline, updateAISettings } from '../services/apiClient';

interface UnderstandingPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
  onCancelRun?: () => void;
}

export const UnderstandingPage: React.FC<UnderstandingPageProps> = ({
  appState,
  onRefreshStatus,
  onCancelRun
}) => {

  const [isRunning, setIsRunning] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [understanding, setUnderstanding] = useState<ApplicationUnderstanding | undefined>(appState?.understanding);
  const [errorDetails, setErrorDetails] = useState<{
    error_code: string;
    error_message: string;
    diagnostics?: Record<string, any>;
    retryable?: boolean;
  } | null>(null);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';

  useEffect(() => {
    if (runId && (currentStatus === 'ai_understanding_running' || currentStatus === 'understanding_ready')) {
      fetchUnderstandingResult();
    }
  }, [runId, currentStatus]);

  const fetchUnderstandingResult = async () => {
    if (!runId) return;
    try {
      const res = await getUnderstanding(runId);
      if (res.status === 'failed') {
        setErrorDetails({
          error_code: res.error_code || 'understanding_failed',
          error_message: res.error_message || 'AI Understanding failed in AI-required mode.',
          diagnostics: res.diagnostics,
          retryable: res.retryable ?? true
        });
        setIsRunning(false);
      } else if (res.status === 'ready' && res.understanding) {
        setErrorDetails(null);
        setUnderstanding(res.understanding);
        setIsRunning(false);
        onRefreshStatus();
      } else if (res.status === 'running') {
        setIsRunning(true);
      }
    } catch (err: any) {
      setErrorDetails({
        error_code: 'network_error',
        error_message: err.message || 'Failed to communicate with API server',
        retryable: true
      });
      setIsRunning(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!runId) return;
    setIsRunning(true);
    setErrorDetails(null);
    try {
      await startUnderstanding(runId);
      const interval = setInterval(async () => {
        const res = await getUnderstanding(runId);
        if (res.status === 'ready' || res.status === 'failed') {
          clearInterval(interval);
          setIsRunning(false);
          onRefreshStatus();
          fetchUnderstandingResult();
        }
      }, 1500);
    } catch (err: any) {
      setIsRunning(false);
      const isFetchErr = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      setErrorDetails({
        error_code: isFetchErr ? 'backend_offline' : 'start_failed',
        error_message: isFetchErr
          ? 'FastAPI backend server is unreachable on http://127.0.0.1:8080. Please ensure the backend is running (run restart_fastapi_app.bat).'
          : (err.message || 'Could not start AI analysis.'),
        retryable: true
      });
    }
  };

  const handleStartPipeline = async () => {
    if (!runId) return;
    setIsPipelineRunning(true);
    setErrorDetails(null);
    try {
      await startPipeline(runId);
      onRefreshStatus();
    } catch (err: any) {
      setErrorDetails({
        error_code: err.error_code || 'pipeline_start_failed',
        error_message: err.message || 'Could not start downstream agents.',
        diagnostics: err.diagnostics,
        retryable: true,
      });
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const provenance = understanding?.provenance;  const attempts = Array.isArray(errorDetails?.diagnostics?.attempts)
    ? errorDetails?.diagnostics?.attempts
    : [];

  const keyRemediationHints = attempts
    .map((attempt: any) => {
      const provider = String(attempt?.provider || 'provider').toUpperCase();
      const code = String(attempt?.error_code || '');
      const status = attempt?.diagnostics?.status_code;
      if (code === 'provider_key_missing' || status === 401 || status === 403) {
        return `${provider}: key rejected (auth failure).`;
      }
      if (code === 'model_discovery_failed') {
        return `${provider}: key invalid for model discovery.`;
      }
      return `${provider}: ${attempt?.error_message || 'request failed'}`;
    })
    .filter(Boolean);

  const [activeTestingTab, setActiveTestingTab] = useState<'ui' | 'api' | 'performance' | 'accessibility'>('ui');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState<string | null>(null);
  const [isKeyBannerDismissed, setIsKeyBannerDismissed] = useState(false);

  const isKeysExhausted = [
    'all_gemini_keys_exhausted',
    'provider_auth_failed',
    'provider_key_missing',
  ].includes(errorDetails?.error_code || '') && !isKeyBannerDismissed;

  const handleSaveNewKey = async () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    setIsSavingKey(true);
    setKeySaveMsg(null);
    try {
      await updateAISettings({ provider_keys: { gemini: trimmed } });
      setKeySaveMsg('Key saved. Retrying analysis...');
      setNewKeyInput('');
      setTimeout(() => {
        setKeySaveMsg(null);
        handleStartAnalysis();
      }, 1200);
    } catch {
      setKeySaveMsg('Failed to save key. Try the Tools → AI Settings tab.');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Testing Type Tab Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'ui', label: 'UI Testing', icon: MonitorSmartphone, available: true },
          { key: 'api', label: 'API Testing', icon: Globe, available: false },
          { key: 'performance', label: 'Performance Testing', icon: Gauge, available: false },
          { key: 'accessibility', label: 'Accessibility Testing', icon: Accessibility, available: false },
        ].map(({ key, label, icon: Icon, available }) => (
          <button
            key={key}
            onClick={() => available && setActiveTestingTab(key as typeof activeTestingTab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTestingTab === key
                ? 'border-sky-500/60 bg-sky-500/10 text-sky-400 shadow-sm'
                : available
                ? 'border-transparent qet-btn-secondary text-slate-400 hover:text-slate-200'
                : 'border-transparent opacity-50 cursor-not-allowed'
            }`}
            disabled={!available}
            title={!available ? 'Coming Soon' : label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {!available && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wider">Soon</span>
            )}
          </button>
        ))}
      </div>
      {/* Header Banner */}
      <div className="qet-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold qet-badge-accent">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>F02 Understanding AI Engine (AI-Required)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--qet-text-primary)' }}>
              Application Structure & Requirements Understanding
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--qet-text-muted)' }}>
              Analyzes requirement specifications and extracted codebase components using AI. Fails fast with structured diagnostics if AI provider is disabled, key is missing, or schema validation fails.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartAnalysis}
              disabled={isRunning}
              className="qet-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-sm"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Engine Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{understanding ? 'Re-Run AI Analysis' : 'Start AI Understanding'}</span>
                </>
              )}
            </button>

            {understanding && (
              <button
                onClick={handleStartPipeline}
                disabled={isPipelineRunning || currentStatus === 'generation_running'}
                className="qet-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                {isPipelineRunning || currentStatus === 'generation_running' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Downstream Agents...</span>
                  </>
                ) : (
                  <>
                    <Workflow className="w-4 h-4" />
                    <span>Run Test Generation Agents</span>
                  </>
                )}
              </button>
            )}

            {(isRunning || isPipelineRunning || currentStatus === 'ai_understanding_running' || currentStatus === 'generation_running') && onCancelRun && (
              <button
                onClick={onCancelRun}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Execution</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Diagnostics Surface */}
      {(errorDetails || currentStatus === 'error') && (
        <div className="qet-badge-danger p-6 space-y-4 animate-file-item">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Stage Execution Error</h3>
                <p className="text-xs mt-0.5 opacity-90">
                  {errorDetails?.error_code === 'backend_offline'
                    ? 'FastAPI backend server is offline or unreachable on port 8080.'
                    : 'An error occurred during stage execution. Review the details below.'}
                </p>
              </div>
            </div>
            {errorDetails?.retryable !== false && (
              <button
                onClick={handleStartAnalysis}
                className="qet-btn-secondary inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="qet-card p-3 space-y-1">
              <span className="font-semibold uppercase text-[10px]" style={{ color: 'var(--qet-danger)' }}>Error Code:</span>
              <p className="font-mono font-bold" style={{ color: 'var(--qet-text-primary)' }}>{errorDetails?.error_code || 'execution_error'}</p>
            </div>
            <div className="qet-card p-3 space-y-1">
              <span className="font-semibold uppercase text-[10px]" style={{ color: 'var(--qet-danger)' }}>Actionable Message:</span>
              <p style={{ color: 'var(--qet-text-primary)' }}>{errorDetails?.error_message || appState?.last_error?.error_message || 'Stage execution failed'}</p>
            </div>
          </div>

          {/* Key Exhausted — Inline Add New Key */}
          {isKeysExhausted && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">All API keys exhausted or rejected</p>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">
                      The system tried every configured Gemini key. Add a fresh key below to retry immediately — no need to leave this page.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKeyBannerDismissed(true)}
                  title="Hide this key prompt"
                  className="p-1 rounded text-amber-400/70 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKeyInput}
                  onChange={e => setNewKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isSavingKey && handleSaveNewKey()}
                  placeholder="Paste new Gemini API key (AIza...)"
                  className="flex-1 text-xs font-mono rounded-lg px-3 py-2 border outline-none focus:ring-1 focus:ring-amber-500"
                  style={{
                    backgroundColor: 'var(--qet-surface-elevated)',
                    borderColor: 'var(--qet-border)',
                    color: 'var(--qet-text-primary)',
                  }}
                />
                <button
                  onClick={handleSaveNewKey}
                  disabled={isSavingKey || !newKeyInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {isSavingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save & Retry</span>
                </button>
              </div>
              {keySaveMsg && (
                <p className="text-[11px] font-semibold" style={{ color: keySaveMsg.includes('Failed') ? 'var(--qet-danger)' : 'var(--qet-success)' }}>
                  {keySaveMsg}
                </p>
              )}
              <p className="text-[10px]" style={{ color: 'var(--qet-text-muted)' }}>
                Keys are stored in <code className="font-mono">keys/gemini keys.txt</code> or via Tools → AI Settings.
                The system rotates through all keys automatically on each attempt.
              </p>
            </div>
          )}

          {errorDetails?.diagnostics && (
            <div className="space-y-1.5">
              {keyRemediationHints.length > 0 && (
                <div className="qet-badge-warning p-3 text-xs space-y-1">
                  <p className="font-semibold">Immediate fix</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {keyRemediationHints.map((hint, idx) => (
                      <li key={idx}>{hint}</li>
                    ))}
                  </ul>
                  <p className="mt-1 opacity-90">Go to Tools tab, clear invalid stored keys, paste valid keys, then retry analysis.</p>
                </div>
              )}
              <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--qet-danger)' }}>Diagnostics Payload:</span>
              <pre className="qet-card p-3 text-[11px] font-mono overflow-x-auto" style={{ color: 'var(--qet-text-primary)' }}>
                {JSON.stringify(errorDetails.diagnostics, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Main Understanding Content */}
      {understanding && (
        <div className="space-y-6">
          {/* AI Provenance Metadata Badge Box */}
          <div className="qet-panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--qet-border)' }}>
              <div className="flex items-center space-x-2 text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                <Cpu className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                <span>AI Output Provenance & Audit Metadata</span>
              </div>
              <span className="qet-badge-success text-[11px] font-mono px-2 py-0.5 font-semibold">
                Validation: {understanding.validation_status || 'VALIDATED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Provider</span>
                <p className="font-mono font-bold" style={{ color: 'var(--qet-text-primary)' }}>{provenance?.provider || 'gemini'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Model</span>
                <p className="font-mono font-bold" style={{ color: 'var(--qet-accent)' }}>{provenance?.model || 'gemini-1.5-flash'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Prompt Version</span>
                <p className="font-mono" style={{ color: 'var(--qet-text-secondary)' }}>{provenance?.prompt_version || 'understanding-v2-ai-required'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Fallback Used</span>
                <p className="font-mono font-bold" style={{ color: provenance?.fallback_used ? 'var(--qet-warning)' : 'var(--qet-success)' }}>
                  {provenance?.fallback_used === false ? 'False (AI-Required)' : 'True'}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Summary & Architecture Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="qet-panel p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>Executive Application Summary</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--qet-text-primary)' }}>{understanding.summary}</p>
            </div>
            <div className="qet-panel p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>Architecture & Tech Stack Notes</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--qet-text-primary)' }}>{understanding.architecture_notes}</p>
            </div>
          </div>

          {/* Component Inventory Cards */}
          <div className="qet-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>Discovered Application Components ({understanding.components.length})</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {understanding.components.map((comp) => (
                <div key={comp.component_id} className="qet-card-elevated p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--qet-accent)' }}>{comp.name}</span>
                    <span className="qet-badge-neutral text-[10px] font-mono px-2 py-0.5">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>{comp.description}</p>
                  <div className="text-[11px] font-mono truncate" style={{ color: 'var(--qet-text-muted)' }}>
                    File: <span style={{ color: 'var(--qet-text-primary)' }}>{comp.file_path}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Process Flows */}
          <div className="qet-panel p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Workflow className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>Discovered User Flows ({understanding.flows.length})</h3>
            </div>

            <div className="space-y-3">
              {understanding.flows.map((fl) => (
                <div key={fl.flow_id} className="qet-card-elevated p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>{fl.name}</span>
                    <div className="flex items-center space-x-2 text-[11px] font-mono" style={{ color: 'var(--qet-text-muted)' }}>
                      <span style={{ color: 'var(--qet-accent)' }}>{fl.start_point}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span style={{ color: 'var(--qet-accent)' }}>{fl.end_point}</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>{fl.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fl.steps.map((st, idx) => (
                      <span key={idx} className="qet-badge-neutral text-[11px] px-2 py-0.5">
                        {idx + 1}. {st}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="qet-panel p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>Inferred Requirement Gaps ({understanding.gaps.length})</h3>
              </div>
              <div className="space-y-3">
                {understanding.gaps.map((gp) => (
                  <div key={gp.gap_id} className="qet-card-elevated p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: 'var(--qet-warning-text)' }}>{gp.title}</span>
                      <span className="qet-badge-warning text-[10px] uppercase px-2 py-0.5">
                        {gp.severity}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>{gp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="qet-panel p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>Testability Observations</h3>
              </div>
              <div className="space-y-2">
                {understanding.testability_observations.map((obs, idx) => (
                  <div key={idx} className="qet-card-elevated p-3 text-xs flex items-start space-x-2" style={{ color: 'var(--qet-text-secondary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Test Generation Agent – bottom CTA after understanding output */}
      {understanding && activeTestingTab === 'ui' && (
        <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <PlayCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>Run Test Generation Agent</h3>
                <span className="qet-badge-success text-[10px] uppercase font-bold px-2 py-0.5">Next Step</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                Generate positive, negative, boundary, validation &amp; error-handling test cases from the AI analysis above.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartPipeline}
            disabled={isPipelineRunning || currentStatus === 'generation_running'}
            className="qet-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md whitespace-nowrap cursor-pointer rounded-xl self-stretch sm:self-auto justify-center"
          >
            {isPipelineRunning || currentStatus === 'generation_running' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Test Generation...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Run Test Generation Agent</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!understanding && !errorDetails && !isRunning && (
        <div className="qet-panel p-12 text-center space-y-4">
          <BrainCircuit className="w-12 h-12 mx-auto" style={{ color: 'var(--qet-accent)' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--qet-text-primary)' }}>Ready for AI Understanding Analysis</h3>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--qet-text-muted)' }}>
            Click "Start AI Understanding" above to send uploaded requirement documents and codebase snapshot to the AI understanding engine.
          </p>
        </div>
      )}
    </div>
  );
};
