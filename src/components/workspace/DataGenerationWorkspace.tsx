import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCw
} from 'lucide-react';
import { AppState, SyntheticDataset, SyntheticRecord } from '../../types';

interface DataGenerationWorkspaceProps {
  appState: AppState | null;
  selectedCaseIds: string[];
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

export const DataGenerationWorkspace: React.FC<DataGenerationWorkspaceProps> = ({
  appState,
  selectedCaseIds,
  onRefresh,
  onProceedNext,
}) => {
  const [dataMode, setDataMode] = useState<'ai' | 'upload'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCaseRecord, setSelectedCaseRecord] = useState<{ caseId: string; record: SyntheticRecord } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMappingReport, setUploadMappingReport] = useState<any | null>(null);

  const dataset = appState?.synthetic_dataset;
  const records = dataset?.records || [];
  const recordMap: Record<string, SyntheticRecord> = {};
  records.forEach((rec) => {
    if (rec.target_test_case) {
      recordMap[rec.target_test_case] = rec;
    }
  });

  const testCases = appState?.test_suite?.test_cases || [];
  const targetCases = selectedCaseIds.length > 0
    ? testCases.filter((tc) => selectedCaseIds.includes(tc.case_id))
    : testCases;

  const handleGenerateAI = async () => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          let parsedRecords: any[] = [];
          if (file.name.endsWith('.json')) {
            const json = JSON.parse(text);
            parsedRecords = Array.isArray(json) ? json : json.records || [];
          } else {
            const lines = text.split('\n').filter((l) => l.trim());
            const headers = lines[0].split(',').map((h) => h.trim());
            parsedRecords = lines.slice(1).map((line) => {
              const values = line.split(',').map((v) => v.trim());
              const obj: any = {};
              headers.forEach((h, i) => {
                obj[h] = values[i];
              });
              return obj;
            });
          }

          const mappedCases: string[] = [];
          const unmappedCases: string[] = [];
          targetCases.forEach((tc) => {
            const match = parsedRecords.find((r) => r.test_case_id === tc.case_id || r.target_test_case === tc.case_id);
            if (match) {
              mappedCases.push(tc.case_id);
            } else {
              unmappedCases.push(tc.case_id);
            }
          });

          setUploadMappingReport({
            total_uploaded: parsedRecords.length,
            mapped_count: mappedCases.length,
            unmapped_count: unmappedCases.length,
            mapped_cases: mappedCases,
            unmapped_cases: unmappedCases,
          });
        } catch (err) {
          alert('Failed to parse uploaded data file. Ensure valid JSON or CSV format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const isDataReady = records.length > 0 || (uploadMappingReport && uploadMappingReport.mapped_count > 0);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner */}
      <div className="qet-panel p-6 border-l-4 border-amber-600 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-primary text-[10px] uppercase font-bold px-2 py-0.5">
                Agent 3
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Data Generation Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Generate context-aware synthetic mock data for Positive, Negative, and Boundary test cases, or upload your own dataset.
            </p>
          </div>
          {isDataReady && (
            <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Data Ready</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Selection Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDataMode('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            dataMode === 'ai'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🤖 AI Synthetic Generation (Recommended)</span>
        </button>
        <button
          onClick={() => setDataMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            dataMode === 'upload'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>📂 Upload Your Own Data (CSV / JSON)</span>
        </button>
      </div>

      {/* Content based on Mode */}
      {dataMode === 'ai' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between qet-card p-4 bg-white">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900">
                Target Test Cases ({targetCases.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                AI generates compliant data for positive tests and boundary/malformed inputs for negative tests.
              </p>
            </div>
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="qet-btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{records.length > 0 ? 'Regenerate All Data' : isGenerating ? 'Generating...' : 'Generate Synthetic Data'}</span>
            </button>
          </div>

          {/* Test Case Data Mapping Table */}
          <div className="qet-card divide-y divide-slate-200 bg-white overflow-hidden">
            {targetCases.map((tc) => {
              const record = recordMap[tc.case_id];
              return (
                <div key={tc.case_id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{tc.case_id}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        {tc.case_type}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{tc.title}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {record ? (
                      <button
                        onClick={() => setSelectedCaseRecord({ caseId: tc.case_id, record })}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Data Record</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No record generated yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Upload Mode UI */
        <div className="space-y-4">
          <div
            className="qet-card border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-slate-400 transition-colors bg-white"
            onClick={() => document.getElementById('data-upload-input')?.click()}
          >
            <input
              type="file"
              id="data-upload-input"
              className="hidden"
              accept=".csv,.json"
              onChange={handleFileUpload}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {uploadFile ? uploadFile.name : 'Upload dataset file (.csv or .json)'}
                </p>
                <p className="text-xs text-slate-500">
                  Must contain a <code className="text-slate-800 font-bold">test_case_id</code> column to bind records to test cases.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Mapping Report */}
          {uploadMappingReport && (
            <div className="qet-card p-5 space-y-4 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                <span>Dataset Mapping Validation Report</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="qet-panel p-3 text-center bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Uploaded Records</span>
                  <p className="text-lg font-bold text-slate-900">{uploadMappingReport.total_uploaded}</p>
                </div>
                <div className="qet-panel p-3 text-center bg-[#E8F5E9]">
                  <span className="text-[10px] uppercase font-bold text-[#1B4332]">Mapped Cases</span>
                  <p className="text-lg font-bold text-[#1B4332]">{uploadMappingReport.mapped_count}</p>
                </div>
                <div className="qet-panel p-3 text-center bg-amber-50">
                  <span className="text-[10px] uppercase font-bold text-amber-800">Unmapped Cases</span>
                  <p className="text-lg font-bold text-amber-800">{uploadMappingReport.unmapped_count}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Inspector Modal */}
      {selectedCaseRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-xl max-h-[80vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Database className="w-4 h-4 text-slate-700" />
                <span>Synthetic Data: {selectedCaseRecord.caseId}</span>
              </h3>
              <button
                onClick={() => setSelectedCaseRecord(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                Close (Esc)
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap border border-slate-200">
              {JSON.stringify(selectedCaseRecord.record, null, 2)}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Stage 3: Synthetic Test Data Ready
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Next: Test Script Agent
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Advance to synthesize dedicated Python Playwright test scripts with POM and screenshot fixtures.
          </p>
        </div>
        <button
          onClick={onProceedNext}
          disabled={!isDataReady}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Proceed to Test Script Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
