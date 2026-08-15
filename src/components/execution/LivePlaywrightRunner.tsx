import React, { useState, useMemo } from 'react';
import { 
  Play, 
  FileCode, 
  Database, 
  CheckSquare, 
  Square, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Layers,
  Sparkles,
  Eye,
  RotateCcw
} from 'lucide-react';
import { TestCase, PlaywrightScript, SyntheticDataset } from '../../types';
import { PlaywrightScriptModal } from './PlaywrightScriptModal';
import { TestDataModal } from './TestDataModal';

interface LivePlaywrightRunnerProps {
  testCases: TestCase[];
  selectedCaseIds: string[];
  playwrightScripts?: PlaywrightScript[];
  syntheticDataset?: SyntheticDataset | null;
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
  playwrightScripts = [],
  syntheticDataset = null,
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

  // Modals state
  const [selectedScriptCase, setSelectedScriptCase] = useState<TestCase | null>(null);
  const [selectedDataCase, setSelectedDataCase] = useState<TestCase | null>(null);

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

  const selectByCategory = (category: string) => {
    const categoryCases = testCases.filter(
      (tc) => category === 'ALL' || tc.case_type.toLowerCase() === category.toLowerCase()
    );
    const categoryIds = categoryCases.map((tc) => tc.case_id);
    const merged = Array.from(new Set([...selectedCaseIds, ...categoryIds]));
    onSelectAll(merged);
  };

  const getCaseTypeBadge = (type: string) => {
    switch (type) {
      case 'Positive':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">Positive</span>;
      case 'Negative':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-700/60">Negative</span>;
      case 'Boundary':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">Boundary</span>;
      case 'Validation':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60">Validation</span>;
      case 'Error-Handling':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-700/60">Error-Handling</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
    }
  };

  const getStatusIndicator = (caseId: string) => {
    if (currentRunningCaseId === caseId) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Running Live...</span>
        </span>
      );
    }
    const status = caseStatusMap[caseId];
    if (status === 'PASSED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>PASSED</span>
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>FAILED</span>
        </span>
      );
    }
    return <span className="text-xs text-slate-500 font-mono">Not Run</span>;
  };

  const getScriptForCase = (caseId: string) => {
    return playwrightScripts.find(
      (s) => s.test_case_id === caseId || s.filename.toLowerCase().includes(caseId.toLowerCase().replace(/-/g, '_'))
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col gap-4 text-slate-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Generated Playwright Test Cases &amp; Automation Hub
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 text-xs font-semibold">
              {testCases.length} Scenarios
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inspect dedicated Python scripts (<code className="text-cyan-400 font-mono text-[11px]">test_tc_*.py</code>), review synthetic datasets, or execute selected test cases in a live headed desktop browser window.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2.5">
          {selectedCaseIds.length > 0 && (
            <button
              onClick={() => onRunSelected(selectedCaseIds)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run {selectedCaseIds.length} Selected (New Window)</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Category Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {caseTypes.map((type) => {
            const count = type === 'ALL' 
              ? testCases.length 
              : testCases.filter(c => c.case_type.toLowerCase() === type.toLowerCase()).length;
            
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs rounded-lg transition font-medium cursor-pointer flex items-center gap-1.5 ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{type}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === type ? 'bg-blue-800 text-white' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search test case, scenario, or locator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectFilteredAll}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-3.5 font-bold">Case ID</th>
              <th className="p-3.5 font-bold">Type</th>
              <th className="p-3.5 font-bold">Feature Area &amp; Scenario</th>
              <th className="p-3.5 font-bold">Script &amp; Data Inspection</th>
              <th className="p-3.5 font-bold">Status</th>
              <th className="p-3.5 text-right font-bold">Live Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No test cases match the active filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((tc) => {
                const isSelected = selectedCaseIds.includes(tc.case_id);
                const isCurrent = currentRunningCaseId === tc.case_id;
                const matchedScript = getScriptForCase(tc.case_id);
                const scriptFile = matchedScript?.filename || `test_${tc.case_id.toLowerCase().replace(/-/g, '_')}.py`;

                return (
                  <tr
                    key={tc.case_id}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      isCurrent ? 'bg-blue-950/40 border-l-2 border-blue-500' : ''
                    } ${isSelected ? 'bg-slate-800/20' : ''}`}
                    onClick={() => onToggleSelect(tc.case_id)}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(tc.case_id)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Case ID */}
                    <td className="p-3.5 font-mono font-bold text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {tc.case_id}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5">
                      {getCaseTypeBadge(tc.case_type)}
                    </td>

                    {/* Title & Feature Area */}
                    <td className="p-3.5 max-w-sm">
                      <div className="font-semibold text-slate-100">{tc.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5 truncate flex items-center gap-1.5">
                        <span className="text-cyan-400 font-medium">{tc.feature_area}</span>
                        {tc.priority && (
                          <span className="text-slate-500">&middot; Priority: {tc.priority}</span>
                        )}
                      </div>
                    </td>

                    {/* Script & Data Inspect Buttons */}
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {/* View Script Button */}
                        <button
                          onClick={() => setSelectedScriptCase(tc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer shadow-sm"
                          title="View generated Python Playwright script"
                        >
                          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>View Script</span>
                        </button>

                        {/* View Data Button */}
                        <button
                          onClick={() => setSelectedDataCase(tc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer shadow-sm"
                          title="View synthetic mock data for this test"
                        >
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Data</span>
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {getStatusIndicator(tc.case_id)}
                    </td>

                    {/* Live Action Button */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRunSingle(tc.case_id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded-lg border border-slate-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                        title="Execute single script in live headed desktop window"
                      >
                        <Play className="w-3 h-3 fill-current" />
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

      {/* Script Viewer Modal */}
      {selectedScriptCase && (
        <PlaywrightScriptModal
          isOpen={Boolean(selectedScriptCase)}
          onClose={() => setSelectedScriptCase(null)}
          testCase={selectedScriptCase}
          script={getScriptForCase(selectedScriptCase.case_id)}
          onRunSingle={onRunSingle}
          isLoading={isLoading}
        />
      )}

      {/* Test Data Inspector Modal */}
      {selectedDataCase && (
        <TestDataModal
          isOpen={Boolean(selectedDataCase)}
          onClose={() => setSelectedDataCase(null)}
          testCase={selectedDataCase}
          syntheticDataset={syntheticDataset}
        />
      )}

    </div>
  );
};
