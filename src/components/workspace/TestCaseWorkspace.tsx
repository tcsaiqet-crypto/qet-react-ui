import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Filter, 
  RotateCw, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  Loader2,
  Activity,
  Bot,
  Check
} from 'lucide-react';
import { startPipeline } from '../../services/apiClient';
import { AppState, TestCase } from '../../types';

interface TestCaseWorkspaceProps {
  appState: AppState | null;
  selectedCaseIds: string[];
  onSelectCaseIds: (caseIds: string[]) => void;
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

export const TestCaseWorkspace: React.FC<TestCaseWorkspaceProps> = ({
  appState,
  selectedCaseIds,
  onSelectCaseIds,
  onRefresh,
  onProceedNext,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);

  const testSuite = appState?.test_suite;
  const testCases: TestCase[] = testSuite?.test_cases || [];

  // Step cycling during test case generation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationStep(1);
      timer = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Filter test cases by selected category
  const filteredCases = testCases.filter((tc) => {
    if (activeCategoryFilter === 'ALL') return true;
    return tc.case_type?.toUpperCase() === activeCategoryFilter.toUpperCase();
  });

  const handleToggleSelect = (caseId: string) => {
    if (selectedCaseIds.includes(caseId)) {
      onSelectCaseIds(selectedCaseIds.filter((id) => id !== caseId));
    } else {
      onSelectCaseIds([...selectedCaseIds, caseId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCases.map((tc) => tc.case_id);
    const combined = Array.from(new Set([...selectedCaseIds, ...filteredIds]));
    onSelectCaseIds(combined);
  };

  const handleClearSelection = () => {
    onSelectCaseIds([]);
  };

  const handleGenerate = async () => {
    if (!appState?.run_id) return;
    try {
      setIsGenerating(true);
      await startPipeline(appState.run_id);
      await onRefresh(appState.run_id);
      setIsGenerating(false);
    } catch (err) {
      setIsGenerating(false);
      await onRefresh(appState.run_id);
    }
  };

  const categoryColor = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'POSITIVE':
        return 'bg-[#E8F5E9] text-[#1B4332] border-[#C8E6C9]';
      case 'NEGATIVE':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'BOUNDARY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'VALIDATION':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ERROR-HANDLING':
      case 'ERROR_HANDLING':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner */}
      <div className="qet-panel p-6 border-l-4 border-[#2D6A4F] bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-success text-[10px] uppercase font-bold px-2 py-0.5">
                Agent 2
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Test Case Generation Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Synthesize 5 distinct test case types mapped directly to application requirements and flows.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="qet-btn-secondary text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{testCases.length > 0 ? 'Regenerate Suite' : isGenerating ? 'Generating...' : 'Generate Test Cases'}</span>
          </button>
        </div>
      </div>

      {/* Live AI Generation Progress Card */}
      {isGenerating && (
        <div className="qet-card p-6 space-y-4 border border-[#2D6A4F]/40 bg-[#E8F5E9]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[#2D6A4F] animate-bounce" />
              <h3 className="text-sm font-bold text-[#1B4332]">
                Synthesizing AI Test Cases in Progress...
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#2D6A4F]">
              Step {generationStep} of 3
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
            <div 
              className="bg-[#2D6A4F] h-full transition-all duration-700 rounded-full"
              style={{ width: `${generationStep === 1 ? 35 : generationStep === 2 ? 70 : 95}%` }}
            />
          </div>

          {/* Detailed Sub-Steps */}
          <div className="space-y-2 text-xs">
            <div className={`flex items-center gap-2 ${generationStep >= 1 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
              {generationStep > 1 ? <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" /> : <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F] shrink-0" />}
              <span>Step 1: Ingesting discovered UI components, selectors & user journeys</span>
            </div>
            <div className={`flex items-center gap-2 ${generationStep >= 2 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
              {generationStep > 2 ? <Check className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" /> : generationStep === 2 ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F] shrink-0" /> : <Activity className="w-3.5 h-3.5 shrink-0" />}
              <span>Step 2: AI synthesizing Positive, Negative, Boundary, Validation, and Error-Handling scenarios</span>
            </div>
            <div className={`flex items-center gap-2 ${generationStep >= 3 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
              {generationStep === 3 ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F] shrink-0" /> : <Activity className="w-3.5 h-3.5 shrink-0" />}
              <span>Step 3: Constructing requirement traceability matrix & confidence mapping</span>
            </div>
          </div>
        </div>
      )}

      {testCases.length > 0 ? (
        <div className="space-y-4">
          {/* Controls Strip: Filters + Bulk Selection */}
          <div className="flex flex-wrap items-center justify-between gap-4 qet-card p-4 bg-white">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              {['ALL', 'POSITIVE', 'NEGATIVE', 'BOUNDARY', 'VALIDATION', 'ERROR-HANDLING'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeCategoryFilter === cat
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Bulk Selection Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Select All ({filteredCases.length})</span>
              </button>
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Test Cases Table / List */}
          <div className="qet-card divide-y divide-slate-200 bg-white overflow-hidden">
            {filteredCases.map((tc) => {
              const isSelected = selectedCaseIds.includes(tc.case_id);
              const isExpanded = expandedCaseId === tc.case_id;

              return (
                <div key={tc.case_id} className="transition-colors hover:bg-slate-50">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelect(tc.case_id)}
                        className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#2D6A4F]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {tc.case_id}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${categoryColor(tc.case_type)}`}>
                            {tc.case_type || 'Positive'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Area: {tc.feature_area || 'General'}
                          </span>
                          {tc.priority && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {tc.priority} Priority
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {tc.title}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedCaseId(isExpanded ? null : tc.case_id)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 space-y-3 bg-slate-50 text-xs border-t border-slate-200 animate-fade-in">
                      {tc.description && (
                        <div>
                          <span className="font-bold text-slate-600">Description:</span>
                          <p className="text-slate-800 mt-0.5">{tc.description}</p>
                        </div>
                      )}

                      {tc.steps && tc.steps.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-600">Execution Steps:</span>
                          <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-700">
                            {tc.steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {tc.expected_result && (
                        <div>
                          <span className="font-bold text-[#1B4332]">Expected Result:</span>
                          <p className="text-slate-800 mt-0.5 bg-[#E8F5E9] border border-[#C8E6C9] p-2.5 rounded-lg">
                            {tc.expected_result}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !isGenerating && (
          <div className="qet-card p-12 text-center space-y-4 bg-white">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[#E8F5E9] text-[#2D6A4F]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                No Test Cases Generated Yet
              </p>
              <p className="text-xs text-slate-500">
                Click "Generate Test Cases" to create Positive, Negative, Boundary, Validation, and Error-Handling scenarios.
              </p>
            </div>
          </div>
        )
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Stage 2: Test Cases Synthesized
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Selected: {selectedCaseIds.length} / {testCases.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Proceed to generate contextual synthetic mock datasets or upload your own dataset.
          </p>
        </div>
        <button
          onClick={onProceedNext}
          disabled={selectedCaseIds.length === 0 || isGenerating}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Proceed to Data Generation ({selectedCaseIds.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
