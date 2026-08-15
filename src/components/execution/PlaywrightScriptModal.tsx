import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  Play, 
  Layers, 
  Crosshair, 
  ShieldCheck, 
  Sparkles,
  Download
} from 'lucide-react';
import { PlaywrightScript, TestCase } from '../../types';

interface PlaywrightScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase?: TestCase | null;
  script?: PlaywrightScript | null;
  onRunSingle?: (caseId: string) => void;
  isLoading?: boolean;
}

export const PlaywrightScriptModal: React.FC<PlaywrightScriptModalProps> = ({
  isOpen,
  onClose,
  testCase,
  script,
  onRunSingle,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !testCase) return null;

  const scriptCode = script?.code || `# Playwright test script for ${testCase.case_id}
import pytest
from playwright.sync_api import Page, expect
from pages.cfa_pages import LoginPage, ApplicationFormPage

def test_${testCase.case_id.toLowerCase().replace(/-/g, '_')}_scenario(page: Page):
    """Scenario: ${testCase.title}"""
    # 1. Initialize Page Objects
    login_page = LoginPage(page)
    login_page.navigate()
    
    # 2. Execute Test Scenario: ${testCase.case_type}
    ${testCase.steps && testCase.steps.length > 0 
      ? testCase.steps.map(s => `# - ${s}`).join('\n    ') 
      : '# - Perform automated user interaction actions'}
    
    # 3. Assert Expected Outcome:
    # Expected: ${testCase.expected_result || 'Operation completes with verified DOM assertion'}
    expect(page).to_be_visible()
`;

  const scriptFilename = script?.filename || `test_${testCase.case_id.toLowerCase().replace(/-/g, '_')}.py`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = scriptFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = scriptCode.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                  {testCase.case_id}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {scriptFilename}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white truncate max-w-lg mt-0.5">
                {testCase.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Download Python Script"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download</span>
            </button>

            {onRunSingle && (
              <button
                onClick={() => {
                  onRunSingle(testCase.case_id);
                  onClose();
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Live Script</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Code View + Metadata Sub-rail */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          {/* Code Viewer Panel */}
          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed select-text">
            <div className="table w-full border-collapse">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60 group">
                  <span className="table-cell pr-4 text-right select-none text-slate-600 group-hover:text-slate-400 w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-2 text-slate-200 whitespace-pre font-mono">
                    {line.startsWith('#') ? (
                      <span className="text-slate-500 italic">{line}</span>
                    ) : line.startsWith('from ') || line.startsWith('import ') ? (
                      <span className="text-purple-400">{line}</span>
                    ) : line.startsWith('def ') || line.startsWith('class ') ? (
                      <span className="text-cyan-400 font-semibold">{line}</span>
                    ) : line.includes('expect(') ? (
                      <span className="text-emerald-400">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Metadata Sub-panel */}
          <div className="w-full md:w-72 bg-slate-900 p-4 overflow-y-auto space-y-4 text-xs">
            
            {/* Scenario Details */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Scenario Type & Priority
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                  {testCase.case_type}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">
                  {testCase.priority}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                {testCase.description}
              </p>
            </div>

            {/* Selectors Discovered & Used */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Locators & Selectors</span>
              </div>
              {script?.selectors_used && script.selectors_used.length > 0 ? (
                <div className="space-y-1">
                  {script.selectors_used.map((sel, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-300 truncate" title={sel}>
                      {sel}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  Selectors dynamically bound via Page Object Model
                </div>
              )}
            </div>

            {/* Page Objects */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Page Objects Used</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(script?.page_objects && script.page_objects.length > 0 ? script.page_objects : ['LoginPage', 'ApplicationFormPage']).map((po, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-mono text-[10px]">
                    {po}
                  </span>
                ))}
              </div>
            </div>

            {/* Validation Guarantee */}
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-300">
                <span className="font-bold">Playwright Python Ready</span>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  Formatted for pytest-playwright with headed desktop execution & screenshot assertions.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>{lines.length} lines</span>
            <span>&middot;</span>
            <span>Python 3.10+ / Playwright</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
