import React, { useState } from 'react';
import { AIScriptModificationResponse } from '../../types';

interface AIScriptModifierModalProps {
  testCaseId: string;
  scriptFilename: string;
  initialCode: string;
  failureLog?: string;
  onClose: () => void;
  onApplyFix: (modifiedCode: string) => Promise<void>;
  onRequestModification: (instruction: string) => Promise<AIScriptModificationResponse>;
}

export const AIScriptModifierModal: React.FC<AIScriptModifierModalProps> = ({
  testCaseId,
  scriptFilename,
  initialCode,
  failureLog,
  onClose,
  onApplyFix,
  onRequestModification,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIScriptModificationResponse | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const resp = await onRequestModification(instruction);
      setAiResponse(resp);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate AI script modification.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!aiResponse) return;
    setIsApplying(true);
    setErrorMsg(null);
    try {
      await onApplyFix(aiResponse.modified_code);
      setAppliedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to apply script modification.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="font-bold text-sm text-white">AI Playwright Script Healer</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {testCaseId}
            </span>
            <span className="text-xs font-mono text-slate-400">({scriptFilename})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-auto flex flex-col gap-4 text-xs">
          {/* Custom Instruction Box */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">
              AI Modification Prompt & Custom Instructions (Optional):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Replace brittle ID with test-id locator, add 2s wait before login click..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>✨ {aiResponse ? 'Regenerate Fix' : 'Generate AI Fix'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300">
              {errorMsg}
            </div>
          )}

          {appliedSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 font-semibold flex items-center gap-2">
              ✓ Successfully applied AI script fix to workspace and run state!
            </div>
          )}

          {/* AI Explanation & Diff Summary */}
          {aiResponse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-purple-950/20 border border-purple-900/40 p-3 rounded-xl">
              <div>
                <span className="font-semibold text-purple-400 uppercase tracking-wider text-xs">
                  AI Explanation & Rationale:
                </span>
                <p className="text-slate-200 mt-1 leading-relaxed">{aiResponse.explanation}</p>
              </div>
              <div>
                <span className="font-semibold text-purple-400 uppercase tracking-wider text-xs">
                  Modifications Applied:
                </span>
                <pre className="text-slate-300 mt-1 font-mono whitespace-pre-wrap">{aiResponse.diff_summary}</pre>
              </div>
            </div>
          )}

          {/* Side-by-side or Code View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[300px]">
            {/* Original Code */}
            <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 font-semibold text-slate-400 flex items-center justify-between">
                <span>Original Script Code</span>
                <span className="text-xs font-mono text-slate-500">Read-Only</span>
              </div>
              <pre className="p-3 font-mono text-xs text-slate-300 overflow-auto flex-1 whitespace-pre">
                {initialCode}
              </pre>
            </div>

            {/* AI Modified Code */}
            <div className="flex flex-col bg-slate-950 border border-purple-900/60 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-purple-950/40 border-b border-purple-900/60 font-semibold text-purple-300 flex items-center justify-between">
                <span>AI Proposed Fixed Script</span>
                <span className="text-xs font-mono text-purple-400">Ready to Apply</span>
              </div>
              <pre className="p-3 font-mono text-xs text-emerald-300 overflow-auto flex-1 whitespace-pre">
                {aiResponse ? aiResponse.modified_code : '// Click "Generate AI Fix" above to produce healed script...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Target File: workspace/generated_playwright_tests/{scriptFilename}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!aiResponse || isApplying || appliedSuccess}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isApplying ? 'Applying Fix...' : '✓ Apply Fix & Save Script'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
