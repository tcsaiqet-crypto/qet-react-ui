import React, { useState, useMemo } from 'react';
import { TestCase } from '../../types';

interface LivePlaywrightRunnerProps {
  testCases: TestCase[];
  selectedCaseIds: string[];
  onToggleSelect: (caseId: string) => void;
  onSelectAll: (caseIds: string[]) => void;
  onRunSingle: (caseId: string) => void;
  onRunSelected: (caseIds: string[]) => void;
  currentRunningCaseId?: string | null;
  caseStatusMap?: Record<string, 'PASSED' | 'FAILED' | 'RUNNING' | 'NOT_RUN'>;
  isLoading?: boolean;
}

export const LivePlaywrightRunner: React.FC<LivePlaywrightRunnerProps> = ({
  testCases,
  selectedCaseIds,
  onToggleSelect,
  onSelectAll,
  onRunSingle,
  onRunSelected,
  currentRunningCaseId,
  caseStatusMap = {},
  isLoading = false,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const caseTypes = ['ALL', 'Positive', 'Negative', 'Boundary', 'Validation', 'Error-Handling'];

  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchesType = filterType === 'ALL' || tc.case_type.toLowerCase() === filterType.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        tc.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.feature_area.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [testCases, filterType, searchQuery]);

  const allFilteredSelected =
    filteredCases.length > 0 && filteredCases.every((tc) => selectedCaseIds.includes(tc.case_id));

  const toggleSelectFilteredAll = () => {
    if (allFilteredSelected) {
      const remaining = selectedCaseIds.filter((id) => !filteredCases.some((tc) => tc.case_id === id));
      onSelectAll(remaining);
    } else {
      const merged = Array.from(new Set([...selectedCaseIds, ...filteredCases.map((tc) => tc.case_id)]));
      onSelectAll(merged);
    }
  };

  const getCaseTypeBadge = (type: string) => {
    switch (type) {
      case 'Positive':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">Positive</span>;
      case 'Negative':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-700/60">Negative</span>;
      case 'Boundary':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">Boundary</span>;
      case 'Validation':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60">Validation</span>;
      case 'Error-Handling':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700/60">Error-Handling</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
    }
  };

  const getStatusIndicator = (caseId: string) => {
    if (currentRunningCaseId === caseId) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          Running...
        </span>
      );
    }
    const status = caseStatusMap[caseId];
    if (status === 'PASSED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          PASSED
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          FAILED
        </span>
      );
    }
    return <span className="text-xs text-slate-500 font-mono">Not Run</span>;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Playwright Test Cases & Dedicated Scripts
            <span className="text-xs font-normal text-slate-400 ml-1">
              ({testCases.length} total scripts generated)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any test case to run its dedicated Playwright script in a new desktop browser window with positive & negative screenshot capture.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {selectedCaseIds.length > 0 && (
            <button
              onClick={() => onRunSelected(selectedCaseIds)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Run {selectedCaseIds.length} Selected (New Window)
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {caseTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search test cases or feature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectFilteredAll}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-3">Test Case ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">Feature Area & Scenario</th>
              <th className="p-3">Dedicated Script File</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No test cases match the active filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((tc) => {
                const isSelected = selectedCaseIds.includes(tc.case_id);
                const isCurrent = currentRunningCaseId === tc.case_id;
                const scriptFile = `tests/test_${tc.case_id.toLowerCase().replace(/-/g, '_')}.py`;

                return (
                  <tr
                    key={tc.case_id}
                    className={`hover:bg-slate-800/50 transition cursor-pointer ${
                      isCurrent ? 'bg-blue-950/40 border-l-2 border-blue-500' : ''
                    } ${isSelected ? 'bg-slate-800/30' : ''}`}
                    onClick={() => onToggleSelect(tc.case_id)}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(tc.case_id)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-200">
                      {tc.case_id}
                    </td>
                    <td className="p-3">
                      {getCaseTypeBadge(tc.case_type)}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-200">{tc.title}</div>
                      <div className="text-slate-400 text-xs mt-0.5 truncate">{tc.feature_area}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-xs">
                      {scriptFile}
                    </td>
                    <td className="p-3">
                      {getStatusIndicator(tc.case_id)}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRunSingle(tc.case_id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-semibold rounded border border-slate-700 transition shadow-sm disabled:opacity-50"
                        title="Run single test in headed desktop window"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>Run Live</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
