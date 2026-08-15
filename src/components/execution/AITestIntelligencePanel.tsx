import React, { useState } from 'react';
import { AITestAnalysisResult, ScriptExecutionDetail } from '../../types';

interface AITestIntelligencePanelProps {
  analysis: AITestAnalysisResult | null;
  onRunAnalysis: () => void;
  onFixScript: (testCaseId: string, scriptFilename: string) => void;
  isLoading?: boolean;
}

export const AITestIntelligencePanel: React.FC<AITestIntelligencePanelProps> = ({
  analysis,
  onRunAnalysis,
  onFixScript,
  isLoading = false,
}) => {
  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">Low Risk</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">Medium Risk</span>;
      case 'high':
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700">High Risk</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">{risk}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            AI Test Suite Intelligence, Diagnostics & Auto-Healing
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-driven analysis of overall testing success, root causes of failures, and automated script healing proposals.
          </p>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <span>✨ Run AI Suite Analysis</span>
            </>
          )}
        </button>
      </div>

      {!analysis ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <svg className="w-12 h-12 mx-auto text-purple-400/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-slate-300 text-sm font-semibold">AI Intelligence Ready</div>
          <div className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            Click "Run AI Suite Analysis" to calculate health scores, defect classifications, and generate script repairs.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Row: Health Score & Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Health Score Gauge Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Overall Test Health Score
              </span>
              <div className="relative flex items-center justify-center w-28 h-28 my-1">
                <div
                  className={`text-3xl font-extrabold ${
                    analysis.overall_health_score >= 80
                      ? 'text-emerald-400'
                      : analysis.overall_health_score >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {analysis.overall_health_score}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Success Rate:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {analysis.test_success_rate}%
                </span>
                {getRiskBadge(analysis.risk_level)}
              </div>
            </div>

            {/* Executive AI Summary Card */}
            <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1.5 mb-2">
                  <span>✨ AI Executive Evaluation</span>
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {analysis.executive_summary}
                </p>
              </div>

              {/* Defect Distribution */}
              {analysis.defect_distribution && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium">Defect Classification Breakdown:</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.entries(analysis.defect_distribution).map(([cat, count]) => {
                      if (count === 0) return null;
                      return (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                        >
                          {cat}: <strong className="text-purple-400">{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Per-Test-Case AI Insights */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Per-Test-Case Root Cause & Remediation Insights ({analysis.test_case_insights.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.test_case_insights.map((insight) => {
                const isPassed = insight.status === 'PASSED';
                return (
                  <div
                    key={insight.test_case_id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 bg-slate-950/70 ${
                      isPassed ? 'border-slate-800' : 'border-rose-900/60 bg-rose-950/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {insight.test_case_id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                            {insight.case_type}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isPassed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {insight.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200">{insight.title}</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{insight.explanation}</p>

                      {insight.root_cause && (
                        <div className="mt-2 text-xs bg-rose-950/40 p-2 rounded border border-rose-900/60 text-rose-300">
                          <strong>Root Cause:</strong> {insight.root_cause}
                        </div>
                      )}

                      {insight.recommended_fix && (
                        <div className="mt-2 text-xs bg-purple-950/30 p-2 rounded border border-purple-800/40 text-purple-300">
                          <strong>Remediation:</strong> {insight.recommended_fix}
                        </div>
                      )}
                    </div>

                    {!isPassed && (
                      <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                        <button
                          onClick={() => onFixScript(insight.test_case_id, `test_${insight.test_case_id.toLowerCase().replace(/-/g, '_')}.py`)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow transition"
                        >
                          <span>✨ Modify & Auto-Fix Script</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key AI Recommendations */}
          {analysis.key_recommendations && analysis.key_recommendations.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
                Strategic QA & Automation Recommendations
              </span>
              <ul className="flex flex-col gap-1.5 mt-1">
                {analysis.key_recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-purple-400 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
