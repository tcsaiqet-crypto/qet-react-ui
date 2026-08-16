import React, { useState } from 'react';
import { 
  FileCode, 
  Download, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCw, 
  Copy, 
  Check
} from 'lucide-react';
import { AppState, PlaywrightScript, TestCase } from '../../types';

interface TestScriptWorkspaceProps {
  appState: AppState | null;
  selectedCaseIds: string[];
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

export const TestScriptWorkspace: React.FC<TestScriptWorkspaceProps> = ({
  appState,
  selectedCaseIds,
  onRefresh,
  onProceedNext,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScript, setSelectedScript] = useState<PlaywrightScript | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const scripts: PlaywrightScript[] = (appState as any)?.playwright_scripts || [];
  const testCases: TestCase[] = appState?.test_suite?.test_cases || [];

  const scriptMap: Record<string, PlaywrightScript> = {};
  scripts.forEach((s) => {
    if (s.test_case_id) {
      scriptMap[s.test_case_id] = s;
    }
  });

  const targetCases = selectedCaseIds.length > 0
    ? testCases.filter((tc) => selectedCaseIds.includes(tc.case_id))
    : testCases;

  const handleGenerateScripts = async () => {
    if (!appState?.run_id) return;
    try {
      setIsGenerating(true);
      const { startPipeline } = await import('../../services/apiClient');
      await startPipeline(appState.run_id);
      await onRefresh(appState.run_id);
      setIsGenerating(false);
    } catch (err) {
      setIsGenerating(false);
      await onRefresh(appState.run_id);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isScriptsReady = scripts.length > 0;

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner */}
      <div className="qet-panel p-6 border-l-4 border-blue-600 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-primary text-[10px] uppercase font-bold px-2 py-0.5">
                Agent 4
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Test Script Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Synthesize dedicated, modular Python Playwright automation test scripts with Page Object Models and auto-screenshot fixtures.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateScripts}
              disabled={isGenerating}
              className="qet-btn-secondary text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isScriptsReady ? 'Regenerate Scripts' : isGenerating ? 'Generating...' : 'Generate Playwright Scripts'}</span>
            </button>
            {isScriptsReady && (
              <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>{scripts.length} Scripts Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Script List Table */}
      {isScriptsReady ? (
        <div className="qet-card divide-y divide-slate-200 bg-white overflow-hidden">
          {targetCases.map((tc) => {
            const script = scriptMap[tc.case_id];
            const hasUncertain = script && script.uncertain_selectors && script.uncertain_selectors.length > 0;

            return (
              <div key={tc.case_id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{tc.case_id}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      {tc.case_type}
                    </span>
                    {script && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        hasUncertain
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-[#E8F5E9] text-[#1B4332] border-[#C8E6C9]'
                      }`}>
                        {hasUncertain ? '⚠️ Medium Confidence' : '✅ High Confidence'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{tc.title}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {script ? (
                    <button
                      onClick={() => setSelectedScript(script)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                    >
                      <Code2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Script Code</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Pending generation</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="qet-card p-12 text-center space-y-4 bg-white">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 text-blue-600">
            <FileCode className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">
              Playwright Test Scripts Not Generated
            </p>
            <p className="text-xs text-slate-500">
              Click "Generate Playwright Scripts" to produce dedicated Python test files for every test case.
            </p>
          </div>
        </div>
      )}

      {/* Script Viewer Modal */}
      {selectedScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-3xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedScript.filename || `test_${selectedScript.test_case_id}.py`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(selectedScript.code || '')}
                  className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1 border border-slate-200"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => setSelectedScript(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                >
                  Close (Esc)
                </button>
              </div>
            </div>

            {/* Code Surface */}
            <div className="flex-1 overflow-auto bg-[#1E242B] p-4 rounded-xl font-mono text-xs text-slate-200 leading-relaxed whitespace-pre border border-slate-300">
              {selectedScript.code || '# No script code generated.'}
            </div>

            {/* Discovered Selectors Strip */}
            {selectedScript.selectors_used && selectedScript.selectors_used.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Selectors Utilized:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedScript.selectors_used.map((sel, sIdx) => (
                    <span key={sIdx} className="text-[10px] font-mono bg-white text-[#2D6A4F] px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {sel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Stage 4: Playwright Automation Package Ready
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Next: Execute Agent
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Proceed to execute test scripts sequentially with live console logs and screenshot evidence capture.
          </p>
        </div>
        <button
          onClick={onProceedNext}
          disabled={!isScriptsReady}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Proceed to Execute Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
