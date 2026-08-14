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
  Info
} from 'lucide-react';
import { AppState, ApplicationUnderstanding } from '../types';
import { startUnderstanding, getUnderstanding } from '../services/apiClient';

interface UnderstandingPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
}

export const UnderstandingPage: React.FC<UnderstandingPageProps> = ({
  appState,
  onRefreshStatus
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    error_code: string;
    error_message: string;
    diagnostics?: Record<string, any>;
    retryable?: boolean;
  } | null>(null);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';
  const understanding: ApplicationUnderstanding | undefined = appState?.understanding;

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
      // Poll until finished
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
      setErrorDetails({
        error_code: 'start_failed',
        error_message: err.message || 'Could not start AI analysis.',
        retryable: true
      });
    }
  };

  const provenance = understanding?.provenance;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 p-8 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-semibold">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>F02 Understanding AI Engine (AI-Required)</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight sm:text-3xl">
              Application Structure & Requirements Understanding
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes requirement specifications and extracted codebase components using AI. Fails fast with structured diagnostics if AI provider is disabled, key is missing, or schema validation fails.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartAnalysis}
              disabled={isRunning}
              className={`
                inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-lg
                ${isRunning 
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-wait' 
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white hover:opacity-95 shadow-purple-500/20 cursor-pointer hover:scale-[1.02]'}
              `}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                  <span>AI Engine Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{understanding ? 'Re-Run AI Analysis' : 'Start AI Understanding'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Diagnostics Surface (AI Fail-Fast Observability) */}
      {(errorDetails || currentStatus === 'error') && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-800/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 text-rose-300">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">AI Stage Execution Failure (Fail-Fast Diagnostics)</h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  AI-Required mode active. No fabricated or fake deterministic fallback content returned.
                </p>
              </div>
            </div>
            {errorDetails?.retryable !== false && (
              <button
                onClick={handleStartAnalysis}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 text-xs font-semibold transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-rose-900/50 space-y-1">
              <span className="font-semibold text-rose-400 uppercase text-[10px]">Error Code:</span>
              <p className="font-mono text-slate-200 font-bold">{errorDetails?.error_code || 'execution_error'}</p>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-lg border border-rose-900/50 space-y-1">
              <span className="font-semibold text-rose-400 uppercase text-[10px]">Actionable Message:</span>
              <p className="text-slate-200">{errorDetails?.error_message || appState?.last_error?.error_message || 'Stage execution failed'}</p>
            </div>
          </div>

          {errorDetails?.diagnostics && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-rose-400 uppercase">Diagnostics Payload:</span>
              <pre className="bg-slate-950 p-3 rounded-lg border border-rose-950 text-[11px] font-mono text-rose-200 overflow-x-auto">
                {JSON.stringify(errorDetails.diagnostics, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Main Understanding Content */}
      {understanding && (
        <div className="space-y-6">
          
          {/* AI Provenance Metadata Badge Box (F05 Observability) */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>AI Output Provenance & Audit Metadata</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                Validation: {understanding.validation_status || 'VALIDATED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Provider</span>
                <p className="font-mono text-slate-200 font-bold">{provenance?.provider || 'gemini'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Model</span>
                <p className="font-mono text-cyan-300 font-bold">{provenance?.model || 'gemini-1.5-flash'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Prompt Version</span>
                <p className="font-mono text-slate-300">{provenance?.prompt_version || 'understanding-v2-ai-required'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Fallback Used</span>
                <p className="font-mono font-bold text-indigo-400">
                  {provenance?.fallback_used === false ? 'False (AI-Required)' : 'True'}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Summary & Architecture Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-3 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Application Summary</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{understanding.summary}</p>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-3 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Architecture & Tech Stack Notes</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{understanding.architecture_notes}</p>
            </div>
          </div>

          {/* Component Inventory Cards */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Discovered Application Components ({understanding.components.length})</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {understanding.components.map((comp) => (
                <div key={comp.component_id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">{comp.name}</span>
                    <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{comp.description}</p>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    File: <span className="text-slate-300">{comp.file_path}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Process Flows */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <Workflow className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Discovered User Flows ({understanding.flows.length})</h3>
            </div>

            <div className="space-y-3">
              {understanding.flows.map((fl) => (
                <div key={fl.flow_id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{fl.name}</span>
                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                      <span className="text-cyan-400">{fl.start_point}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className="text-purple-400">{fl.end_point}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{fl.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {fl.steps.map((st, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-800">
                        {idx + 1}. {st}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inferred Requirement Gaps & Entry Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gaps */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200">Inferred Requirement Gaps ({understanding.gaps.length})</h3>
              </div>
              <div className="space-y-3">
                {understanding.gaps.map((gp) => (
                  <div key={gp.gap_id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">{gp.title}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        {gp.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{gp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Points & Testability Observations */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200">Testability Observations</h3>
              </div>
              <div className="space-y-2">
                {understanding.testability_observations.map((obs, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Empty State when no understanding run yet */}
      {!understanding && !errorDetails && !isRunning && (
        <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-12 text-center space-y-4">
          <BrainCircuit className="w-12 h-12 text-purple-400/50 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Ready for AI Understanding Analysis</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Start AI Understanding" above to send uploaded requirement documents and codebase snapshot to the AI understanding engine.
          </p>
        </div>
      )}

    </div>
  );
};
