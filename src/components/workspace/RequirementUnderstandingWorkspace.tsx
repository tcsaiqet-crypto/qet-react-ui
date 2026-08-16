import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Network, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCw, 
  ArrowRight, 
  Monitor, 
  Globe, 
  Gauge, 
  Accessibility, 
  Check, 
  FileCode, 
  KeyRound, 
  Plus, 
  X, 
  Loader2, 
  Activity, 
  BrainCircuit
} from 'lucide-react';
import { startUnderstanding, updateAISettings } from '../../services/apiClient';
import { AppState } from '../../types';
import { frontendLogger } from '../../utils/frontendLogger';

interface RequirementUnderstandingWorkspaceProps {
  appState: AppState | null;
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
  onOpenSettings?: () => void;
}

export const RequirementUnderstandingWorkspace: React.FC<RequirementUnderstandingWorkspaceProps> = ({
  appState,
  onRefresh,
  onProceedNext,
  onOpenSettings,
}) => {
  const [activeDomainTab, setActiveDomainTab] = useState<'ui' | 'api' | 'performance' | 'accessibility'>('ui');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(15);
  const [activeStepText, setActiveStepText] = useState('Parsing uploaded requirements & codebase AST snapshot...');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState<string | null>(null);
  const [isKeyBannerDismissed, setIsKeyBannerDismissed] = useState(false);
  const understanding = appState?.understanding;
  const isCompleted = Boolean(understanding && (understanding.summary || (understanding.components && understanding.components.length > 0)));
  const errorDetails = appState?.last_error;
  const isRunning = (isAnalyzing || appState?.status === 'ai_understanding_running') && appState?.status !== 'error' && !isCompleted;

  const isKeysExhausted = [
    'all_gemini_keys_exhausted',
    'provider_auth_failed',
    'provider_key_missing',
    'provider_key_rejected',
  ].includes(errorDetails?.error_code || '') && !isKeyBannerDismissed;

  // Dynamic progress animation
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let textTimer: NodeJS.Timeout;

    if (isRunning) {
      frontendLogger.info(`[AI START] AI Understanding analysis initiated for run ${appState?.run_id || 'active'}`);
      setProgressPercent(15);
      
      const stepMessages = [
        'Ingesting requirement specifications and codebase AST symbols...',
        'AI reasoning across UI routes, buttons, inputs and event handlers...',
        'Grounding reliable DOM selectors (data-testid, IDs, ARIA roles)...',
        'Synthesizing end-to-end user navigation flows & decision nodes...',
        'Evaluating 15-point quality checklist and requirement coverage matrix...',
        'Finalizing structured intelligence schema payload...',
      ];
      let msgIndex = 0;
      setActiveStepText(stepMessages[0]);
      frontendLogger.info(`[AI PIPELINE] ${stepMessages[0]}`);

      textTimer = setInterval(() => {
        msgIndex = (msgIndex + 1) % stepMessages.length;
        setActiveStepText(stepMessages[msgIndex]);
        frontendLogger.info(`[AI PIPELINE] ${stepMessages[msgIndex]}`);
      }, 3000);

      progressTimer = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 94) return 94;
          return prev + Math.floor(Math.random() * 8) + 4;
        });
      }, 800);
    } else if (isCompleted) {
      setProgressPercent(100);
      frontendLogger.info(`[AI COMPLETE] Application understanding validated with structured UI & requirement components.`);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(textTimer);
    };
  }, [isRunning, isCompleted]);

  const handleStartAnalysis = async () => {
    if (!appState?.run_id) return;
    try {
      setIsAnalyzing(true);
      frontendLogger.info(`[AI START] Dispatched AI Understanding task for run ${appState.run_id}...`);
      await startUnderstanding(appState.run_id);
      await onRefresh(appState.run_id);
      setIsAnalyzing(false);
    } catch (err) {
      frontendLogger.error(`[AI ERROR] Understanding analysis failed: ${String(err)}`);
      setIsAnalyzing(false);
      await onRefresh(appState.run_id);
    }
  };

  const handleSaveNewKey = async () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    try {
      setIsSavingKey(true);
      setKeySaveMsg(null);
      await updateAISettings({
        active_provider: 'gemini',
        provider_keys: { gemini: trimmed },
        clear_provider_keys: [],
      });
      setKeySaveMsg('Key saved! Retrying analysis...');
      frontendLogger.info('[SETTINGS] Fresh API Key configured. Retrying AI analysis...');
      setNewKeyInput('');
      setIsKeyBannerDismissed(true);
      if (appState?.run_id) {
        await startUnderstanding(appState.run_id);
        await onRefresh(appState.run_id);
      }
    } catch (err: any) {
      setKeySaveMsg(`Failed to save key: ${err.message || String(err)}`);
      frontendLogger.error(`[SETTINGS] Failed to save key: ${err.message || String(err)}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner (Blue Accent) */}
      <div className="qet-panel p-6 border-l-4 border-blue-600 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-primary text-[10px] uppercase font-bold px-2 py-0.5">
                Sub-Agent 1c
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Requirement Understanding Sub-Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              AI-driven synthesis of requirements and codebase AST to ground testable components, selectors, and user flows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAnalysis}
              disabled={isRunning}
              className="qet-btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-2 shadow-xs hover:bg-slate-100 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isCompleted ? 'Re-Analyze' : isRunning ? 'AI Synthesizing...' : 'Run AI Understanding'}</span>
            </button>
            {isCompleted && !isRunning && (
              <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Validated</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Active AI Blue Progress Dashboard & Animation ── */}
      {isRunning && (
        <div className="qet-card p-6 space-y-5 border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 animate-pulse">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>AI Application Understanding in Progress</span>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </h3>
                <p className="text-xs text-blue-700 font-medium mt-0.5 animate-pulse">
                  {activeStepText}
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-lg border border-blue-200">
              {progressPercent}%
            </span>
          </div>

          {/* Smooth Blue Animated Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full transition-all duration-500 rounded-full shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Sub-Agent Micro-Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              progressPercent >= 30 ? 'bg-white border-blue-200 shadow-2xs text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              {progressPercent >= 40 ? <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" /> : <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
              <span className="font-medium truncate">1. Codebase & Doc Ingestion</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              progressPercent >= 50 ? 'bg-white border-blue-200 shadow-2xs text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              {progressPercent >= 75 ? <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" /> : progressPercent >= 40 ? <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" /> : <Activity className="w-4 h-4 shrink-0 text-slate-300" />}
              <span className="font-medium truncate">2. DOM Selector Grounding</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              progressPercent >= 80 ? 'bg-white border-blue-200 shadow-2xs text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              {progressPercent >= 95 ? <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" /> : progressPercent >= 75 ? <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" /> : <Activity className="w-4 h-4 shrink-0 text-slate-300" />}
              <span className="font-medium truncate">3. User Flows & 15-Pt Checklist</span>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer Skeleton Placeholder while Running */}
      {isRunning && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="qet-card p-5 space-y-3 bg-white border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
            <div className="qet-card p-5 space-y-3 bg-white border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          </div>

          <div className="qet-card p-5 space-y-3 bg-white border border-slate-200">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-100" />
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-100" />
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {(errorDetails || appState?.status === 'error') && !isCompleted && !isRunning && (
        <div className="qet-badge-danger p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0 text-rose-600" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Analysis Stage Error</h4>
                <p className="text-xs text-rose-700">
                  {errorDetails?.error_message || 'An error occurred during AI analysis.'}
                </p>
              </div>
            </div>
          </div>

          {/* Dismissible Key Recovery Prompt */}
          {isKeysExhausted && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">All Gemini API keys exhausted or rejected</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Enter a fresh API key below to retry immediately.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKeyBannerDismissed(true)}
                  title="Hide prompt"
                  className="p-1 rounded text-amber-600 hover:text-amber-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={handleSaveNewKey}
                  disabled={isSavingKey || !newKeyInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSavingKey ? 'Saving...' : 'Save & Retry'}</span>
                </button>
              </div>
              {keySaveMsg && <p className="text-[11px] text-amber-800">{keySaveMsg}</p>}
            </div>
          )}
        </div>
      )}

      {/* Multi-Domain Testing Tabs (Blue Accent) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveDomainTab('ui')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDomainTab === 'ui'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4 text-blue-600" />
          <span>🖥️ UI Testing Requirement</span>
          <span className="qet-badge-success text-[9px] px-1.5 py-0.2">ACTIVE</span>
        </button>

        <button
          onClick={() => setActiveDomainTab('api')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          <Globe className="w-4 h-4" />
          <span>🌐 API Testing</span>
          <span className="qet-badge-secondary text-[9px] px-1.5 py-0.2">Coming Soon</span>
        </button>

        <button
          onClick={() => setActiveDomainTab('performance')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          <Gauge className="w-4 h-4" />
          <span>⚡ Performance</span>
          <span className="qet-badge-secondary text-[9px] px-1.5 py-0.2">Coming Soon</span>
        </button>

        <button
          onClick={() => setActiveDomainTab('accessibility')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          <Accessibility className="w-4 h-4" />
          <span>♿ Accessibility</span>
          <span className="qet-badge-secondary text-[9px] px-1.5 py-0.2">Coming Soon</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeDomainTab === 'ui' && (
        isCompleted ? (
          <div className="space-y-6">
            {/* Overview Summary */}
            <div className="qet-card p-5 space-y-3 bg-white border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Application Architecture & Domain Overview
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {understanding?.summary || 'CFA Digital Candidate Journey application extracted and mapped successfully.'}
              </p>
            </div>

            {/* Components & Interactive Elements */}
            <div className="qet-card p-5 space-y-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Interactive UI Components ({understanding?.components?.length || 0})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {understanding?.components?.map((comp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {comp.type || 'Component'}
                      </span>
                    </div>
                    {comp.description && (
                      <p className="text-xs text-slate-600">{comp.description}</p>
                    )}
                    {comp.selectors && comp.selectors.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {comp.selectors.slice(0, 3).map((sel, sIdx) => (
                          <code key={sIdx} className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {sel}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* User Journeys & Routes */}
            <div className="qet-card p-5 space-y-4 bg-white border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-600" />
                <span>Extracted User Navigation Flows ({understanding?.flows?.length || 0})</span>
              </h3>
              <div className="space-y-3">
                {understanding?.flows?.map((flow, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{flow.name}</span>
                      {(flow as any).complexity && (
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {(flow as any).complexity}
                        </span>
                      )}
                    </div>
                    {flow.description && (
                      <p className="text-xs text-slate-600">{flow.description}</p>
                    )}
                    {flow.steps && flow.steps.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
                        {flow.steps.map((step, stIdx) => (
                          <React.Fragment key={stIdx}>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                              {step}
                            </span>
                            {stIdx < (flow.steps?.length || 0) - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          !isRunning && (
            <div className="qet-card p-12 text-center space-y-4 bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 text-blue-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Application Understanding Pending
                </p>
                <p className="text-xs text-slate-500">
                  Click "Run AI Understanding" above to extract UI components, selectors, and user journeys.
                </p>
              </div>
            </div>
          )
        )
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Step 1c: Application Understanding Complete
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Next: Test Case Generation Agent
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Advance to synthesize 5-category test cases (Positive, Negative, Boundary, Validation, Error Handling).
          </p>
        </div>
        <button
          onClick={onProceedNext}
          disabled={!isCompleted || isRunning}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Proceed to Test Case Generation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
