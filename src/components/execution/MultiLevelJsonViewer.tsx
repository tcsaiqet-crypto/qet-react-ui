import React, { useState } from 'react';
import { MultiLevelExecutionReport, ScriptExecutionDetail } from '../../types';

interface MultiLevelJsonViewerProps {
  report: MultiLevelExecutionReport | null;
  onModifyScript?: (script: ScriptExecutionDetail) => void;
}

export const MultiLevelJsonViewer: React.FC<MultiLevelJsonViewerProps> = ({ report, onModifyScript }) => {
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-12 text-center">
        <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h4 className="text-sm font-semibold text-slate-300">No Multi-Level JSON Report Available</h4>
        <p className="text-xs text-slate-500 mt-1">
          Execute test cases to generate comprehensive multi-level hierarchical execution diagnostics.
        </p>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi_level_execution_results_${report.run_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredScripts = report.scripts.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.test_case_id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.feature_area.toLowerCase().includes(q) ||
      s.case_type.toLowerCase().includes(q) ||
      (s.why_failed && s.why_failed.toLowerCase().includes(q)) ||
      (s.why_passed && s.why_passed.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col gap-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            Multi-Level JSON Execution Report & Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hierarchical breakdown containing run metrics, case-type pass rates, why-passed / why-failed root causes, and per-script step logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('structured')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                viewMode === 'structured' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structured Hierarchy
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                viewMode === 'raw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw JSON
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            {copied ? '✓ Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Download JSON
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-[600px]">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Level 1: Summary Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Pass Rate</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {report.summary.pass_rate_percentage}%
              </div>
              <span className="text-xs text-slate-500">
                {report.summary.passed_count} passed / {report.summary.total_scripts} scripts
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Total Duration</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">
                {report.summary.duration_seconds}s
              </div>
              <span className="text-xs text-slate-500">Headed desktop mode</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Passed Scripts</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {report.summary.passed_count}
              </div>
              <span className="text-xs text-slate-500">All assertions verified</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Failed Scripts</span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                {report.summary.failed_count}
              </div>
              <span className="text-xs text-slate-500">Diagnostic root causes identified</span>
            </div>
          </div>

          {/* Level 2: Case Type & Feature Area Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Case Type Breakdown */}
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Breakdown by Case Type
              </h4>
              <div className="flex flex-col gap-2 mt-1">
                {Object.entries(report.breakdown_by_case_type || {}).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">{type}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{stats.passed}/{stats.total} passed</span>
                      <span className={`font-mono font-bold ${stats.pass_rate_percentage >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stats.pass_rate_percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Area Breakdown */}
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Breakdown by Feature Area
              </h4>
              <div className="flex flex-col gap-2 mt-1">
                {Object.entries(report.breakdown_by_feature_area || {}).map(([area, stats]) => (
                  <div key={area} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">{area}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{stats.passed}/{stats.total} passed</span>
                      <span className={`font-mono font-bold ${stats.pass_rate_percentage >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stats.pass_rate_percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Level 3: Per-Script Deep Diagnostic Records */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Script-Level Execution Records & Explanations ({filteredScripts.length})
              </h4>
              <input
                type="text"
                placeholder="Filter scripts or root cause..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-500 w-64 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-3">
              {filteredScripts.map((script) => {
                const isExpanded = expandedScriptId === script.script_id;
                const isPassed = script.status === 'PASSED';

                return (
                  <div
                    key={script.script_id}
                    className={`border rounded-xl transition overflow-hidden bg-slate-950/70 ${
                      isPassed ? 'border-slate-800 hover:border-emerald-700/60' : 'border-rose-900/60 bg-rose-950/10'
                    }`}
                  >
                    {/* Collapsible Header */}
                    <div
                      onClick={() => setExpandedScriptId(isExpanded ? null : script.script_id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        ></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">
                              {script.test_case_id}
                            </span>
                            <span className="text-xs text-slate-400">· {script.title}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                              {script.case_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            {script.filename} · {script.duration_ms}ms
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status badge */}
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            isPassed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {script.status}
                        </span>

                        <span className="text-slate-500 text-xs">
                          {isExpanded ? '▲ Collapse' : '▼ Expand Diagnostics'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-4 text-xs">
                        {/* Why Passed / Why Failed */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {script.why_passed && (
                            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg">
                              <span className="text-emerald-400 font-semibold uppercase tracking-wider text-xs">
                                ✓ Why Passed (Validation Explanation)
                              </span>
                              <p className="text-slate-200 mt-1 text-xs leading-relaxed">
                                {script.why_passed}
                              </p>
                            </div>
                          )}

                          {script.why_failed && (
                            <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg">
                              <span className="text-rose-400 font-semibold uppercase tracking-wider text-xs">
                                ✗ Why Failed (Failure Explanation)
                              </span>
                              <p className="text-slate-200 mt-1 text-xs leading-relaxed">
                                {script.why_failed}
                              </p>
                            </div>
                          )}

                          {script.root_cause_analysis && (
                            <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg">
                              <span className="text-amber-400 font-semibold uppercase tracking-wider text-xs">
                                Root Cause Diagnostics ({script.failure_classification || 'Defect'})
                              </span>
                              <p className="text-slate-200 mt-1 text-xs leading-relaxed">
                                {script.root_cause_analysis}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Step Details */}
                        {script.steps && script.steps.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-300 uppercase tracking-wider text-xs">
                              Step Execution Trace
                            </span>
                            <div className="flex flex-col gap-1.5 mt-2">
                              {script.steps.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 font-mono text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500">#{step.step_number}</span>
                                    <span className="text-slate-200">{step.description}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{step.duration_ms}ms</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                        step.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {step.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Execution Logs */}
                        {script.execution_logs && script.execution_logs.length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-300 uppercase tracking-wider text-xs">
                              Subprocess Pytest Execution Logs
                            </span>
                            <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs text-slate-300 max-h-40 overflow-auto whitespace-pre-wrap mt-1">
                              {script.execution_logs.join('\n')}
                            </div>
                          </div>
                        )}

                        {/* Fix with AI Action */}
                        {!isPassed && onModifyScript && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => onModifyScript(script)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
                            >
                              <span>✨ Heal Script with AI</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
