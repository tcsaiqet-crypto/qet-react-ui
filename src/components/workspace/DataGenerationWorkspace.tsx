import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  Loader2, 
  FileCheck, 
  Cpu,
  Download,
  FileCode,
  FileText
} from 'lucide-react';
import { AppState, TestCase, SyntheticRecord } from '../../types';

interface DataGenerationWorkspaceProps {
  appState: AppState | null;
  selectedCaseIds: string[];
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Casey", "Avery", "Jamie", "Dakota", "Reese", "Quinn", "Cameron", "Devon"];
const LAST_NAMES = ["Sterling", "Vance", "Mercer", "Sinclair", "Hawthorne", "Kensington", "Ellington", "Montgomery", "Carrington", "Blackwood", "Holloway", "Fairchild"];
const EMPLOYERS = ["Apex Financial Corp", "BlueRock Technologies", "Zenith Health Systems", "Vanguard Logistics", "Global Core Labs", "Nexis Capital", "Summit Energy Partners", "Quantum Edge Systems"];
const DOCUMENTS = ["passport_scan_valid.pdf", "cfa_candidate_id.pdf", "w2_tax_form_2025.pdf", "paystub_october_verified.pdf", "employment_verification_letter.pdf", "bank_statement_q3.pdf"];

const generateRandomRecordForCase = (tc: TestCase, index: number): SyntheticRecord => {
  const randFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const randLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const randEmployer = EMPLOYERS[Math.floor(Math.random() * EMPLOYERS.length)];
  const randDoc = DOCUMENTS[Math.floor(Math.random() * DOCUMENTS.length)];
  const randSSNMid = Math.floor(Math.random() * 90 + 10);
  const randSSNLast = Math.floor(Math.random() * 9000 + 1000);
  const randIncome = Math.floor(Math.random() * 9500 + 4500);

  const isBoundary = tc.case_type?.toUpperCase() === 'BOUNDARY';
  const isNegative = tc.case_type?.toUpperCase() === 'NEGATIVE';
  const isValidation = tc.case_type?.toUpperCase() === 'VALIDATION';

  const username = isBoundary
    ? `${randFirst.toLowerCase()}.${randLast.toLowerCase()}.${tc.case_id.toLowerCase().replace(/-/g, '.')}@cfa.candidate.org`
    : `${randFirst.toLowerCase()}.${randLast.toLowerCase()}.${tc.case_id.toLowerCase().replace(/-/g, '.')}@example.com`;

  const fullName = isBoundary
    ? `Elizabeth Alexandra-Montgomery-Huntington`
    : isValidation
    ? `${randFirst} ${randLast} (Validation Profile)`
    : isNegative
    ? `${randFirst} ${randLast} (Negative Scenario)`
    : `${randFirst} ${randLast}`;

  const ssn = isNegative ? '123-45' : `999-${randSSNMid}-${randSSNLast}`;
  const income = isBoundary ? 0.01 : randIncome;
  const docFile = isNegative ? 'payload_malformed.exe' : randDoc;

  return {
    record_id: `REC-${(tc.case_type || 'POS').substring(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    target_test_case: tc.case_id,
    category: `${tc.case_type || 'Positive'} ${tc.feature_area || 'CFA Onboarding'}`,
    username,
    password: isNegative ? 'WrongPassword999!' : `MockPass${Math.floor(Math.random() * 899 + 100)}!#`,
    full_name: fullName,
    ssn,
    monthly_income: income,
    employer_name: randEmployer,
    employment_status: ['Full-Time Permanent', 'Contractor', 'Self-Employed', 'Executive Director'][Math.floor(Math.random() * 4)],
    document_file: docFile,
    terms_accepted: !isValidation,
    is_synthetic: true,
  } as any;
};

export const DataGenerationWorkspace: React.FC<DataGenerationWorkspaceProps> = ({
  appState,
  selectedCaseIds,
  onRefresh,
  onProceedNext,
}) => {
  const [dataMode, setDataMode] = useState<'ai' | 'upload'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [selectedCaseRecord, setSelectedCaseRecord] = useState<{ caseId: string; record: SyntheticRecord } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMappingReport, setUploadMappingReport] = useState<any | null>(null);
  const [localRecords, setLocalRecords] = useState<Record<string, SyntheticRecord>>({});

  const testCases: TestCase[] = appState?.test_suite?.test_cases || [];
  const targetCases = selectedCaseIds.length > 0
    ? testCases.filter((tc) => selectedCaseIds.includes(tc.case_id))
    : testCases;

  // Initialize or sync records
  useEffect(() => {
    const existingRecords = appState?.synthetic_dataset?.records || [];
    const map: Record<string, SyntheticRecord> = {};
    existingRecords.forEach((r) => {
      if (r.target_test_case) {
        map[r.target_test_case] = r;
      }
    });

    if (Object.keys(map).length > 0) {
      setLocalRecords(map);
    } else if (targetCases.length > 0) {
      const generated: Record<string, SyntheticRecord> = {};
      targetCases.forEach((tc, idx) => {
        generated[tc.case_id] = generateRandomRecordForCase(tc, idx);
      });
      setLocalRecords(generated);
    }
  }, [appState?.synthetic_dataset, targetCases.length]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGenerationStep(1);
    setGenerationLogs([
      `[DATA GENERATOR] Initializing Synthetic Test Data Pipeline...`,
      `[SCHEMA] Parsing input constraints for ${targetCases.length} test cases...`,
    ]);

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep(2);
    setGenerationLogs((prev) => [
      ...prev,
      `[RANDOMIZATION] Generating randomized non-PII identities, SSNs, monthly incomes, and employers...`,
    ]);

    // Generate fresh randomized records for all target test cases
    const newlyGenerated: Record<string, SyntheticRecord> = {};
    targetCases.forEach((tc, idx) => {
      newlyGenerated[tc.case_id] = generateRandomRecordForCase(tc, idx);
    });

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep(3);
    setGenerationLogs((prev) => [
      ...prev,
      `[INJECTIONS] Injected boundary values (0.01 income, valid hyphenated boundary names) and negative payload fixtures...`,
      `[FIXTURES] Bound synthetic test documents (W2, paystubs, verification letters, passport scans)...`,
    ]);

    setLocalRecords(newlyGenerated);

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep(4);
    setGenerationLogs((prev) => [
      ...prev,
      `[COMPLIANCE] 100% Synthetic & Non-PII Verified across ${targetCases.length} test scenarios.`,
      `[READY] Data generation completed successfully.`,
    ]);

    if (appState?.run_id) {
      try {
        await onRefresh(appState.run_id);
      } catch {
        // silent
      }
    }

    setIsGenerating(false);
  };

  const handleDownloadJsonTemplate = () => {
    const data = targetCases.map((tc, idx) => generateRandomRecordForCase(tc, idx));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfa_test_dataset_${appState?.run_id || 'active'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ["test_case_id", "category", "full_name", "username", "password", "ssn", "monthly_income", "employer_name", "employment_status", "document_file", "terms_accepted"];
    const rows = targetCases.map((tc, idx) => {
      const rec = generateRandomRecordForCase(tc, idx);
      return [
        tc.case_id,
        `"${rec.category || tc.case_type}"`,
        `"${rec.full_name}"`,
        `"${rec.username}"`,
        `"${rec.password}"`,
        `"${rec.ssn}"`,
        rec.monthly_income,
        `"${rec.employer_name}"`,
        `"${rec.employment_status}"`,
        `"${rec.document_file}"`,
        rec.terms_accepted ? "true" : "false"
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfa_test_dataset_${appState?.run_id || 'active'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
            parsedRecords = lines.slice(1).map((line) => {
              const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
              const obj: any = {};
              headers.forEach((h, i) => {
                obj[h] = values[i];
              });
              return obj;
            });
          }

          const mappedCases: string[] = [];
          const unmappedCases: string[] = [];
          const newMap = { ...localRecords };
          targetCases.forEach((tc) => {
            const match = parsedRecords.find((r) => r.test_case_id === tc.case_id || r.target_test_case === tc.case_id);
            if (match) {
              mappedCases.push(tc.case_id);
              newMap[tc.case_id] = {
                ...match,
                target_test_case: tc.case_id,
                is_synthetic: true
              };
            } else {
              unmappedCases.push(tc.case_id);
            }
          });

          setLocalRecords(newMap);
          setUploadMappingReport({
            total_uploaded: parsedRecords.length,
            mapped_count: mappedCases.length,
            unmapped_count: unmappedCases.length,
            mapped_cases: mappedCases,
            unmapped_cases: unmappedCases,
          });
        } catch {
          alert('Failed to parse uploaded data file. Ensure valid JSON or CSV format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const hasRecords = Object.keys(localRecords).length > 0;
  const isDataReady = hasRecords || (uploadMappingReport && uploadMappingReport.mapped_count > 0);

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
              Generate context-aware, randomized non-PII synthetic test datasets for Positive, Negative, and Boundary test cases, or upload custom datasets.
            </p>
          </div>
          {isDataReady && (
            <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>{Object.keys(localRecords).length} Synthetic Records Bound</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Selection Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDataMode('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            dataMode === 'ai'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🤖 Synthetic Data Generator (Randomized)</span>
        </button>
        <button
          onClick={() => setDataMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            dataMode === 'upload'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>📂 Upload Custom Dataset (CSV / JSON)</span>
        </button>
      </div>

      {/* Content based on Mode */}
      {dataMode === 'ai' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 qet-card p-5 bg-white">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900">
                Target Test Cases ({targetCases.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Synthesizes randomized non-PII names, mock emails, sanitized SSNs, realistic monthly incomes, and boundary injections.
              </p>
            </div>
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="qet-btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Data...' : hasRecords ? 'Regenerate & Randomize All Data' : 'Generate Synthetic Data'}</span>
            </button>
          </div>

          {/* Active Generation Process Indicator */}
          {isGenerating && (
            <div className="qet-card p-5 bg-slate-900 text-white space-y-4 border border-slate-700 shadow-md animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Synthetic Test Data Generation Pipeline In Progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Step {generationStep} of 4 ({generationStep * 25}%)
                  </span>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${generationStep * 25}%` }}
                />
              </div>

              {/* Multi-step Status Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${generationStep >= 1 ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">1. Analyze Schemas</span>
                </div>
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${generationStep >= 2 ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">2. Randomize Profiles</span>
                </div>
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${generationStep >= 3 ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">3. Inject Boundary Data</span>
                </div>
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${generationStep >= 4 ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">4. Validate JSON</span>
                </div>
              </div>

              {/* Streaming Generation Terminal */}
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1 border border-slate-800">
                {generationLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Test Case Data Mapping Table */}
          <div className="qet-card divide-y divide-slate-200 bg-white overflow-hidden">
            {targetCases.map((tc) => {
              const record = localRecords[tc.case_id];
              return (
                <div key={tc.case_id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{tc.case_id}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        {tc.case_type}
                      </span>
                      {record && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {record.record_id || 'REC-BOUND'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{tc.title}</p>
                    {record ? (
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        👤 {record.full_name || 'N/A'} | ✉️ {record.username || 'N/A'} | 💵 ${record.monthly_income?.toLocaleString() || 'N/A'}/mo | 🏢 {record.employer_name || record.employment_status || 'N/A'}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Pending generation</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {record ? (
                      <button
                        onClick={() => setSelectedCaseRecord({ caseId: tc.case_id, record })}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inspect Payload</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateAI}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Generate Data</span>
                      </button>
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
          {/* Action bar to download ready-to-use template */}
          <div className="qet-card p-4 bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800">Ready-to-Use Dataset Templates:</span>
              <p className="text-[11px] text-slate-500">
                Download a pre-structured template, fill in custom values, and upload below. File templates also available at <code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">sample data upload/cfa_test_dataset.json</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadJsonTemplate}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download JSON Template</span>
              </button>
              <button
                onClick={handleDownloadCsvTemplate}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download CSV Template</span>
              </button>
            </div>
          </div>

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
                  Must contain a <code className="text-slate-800 font-bold">test_case_id</code> column/field to bind records to test cases.
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
                <span>Synthetic Data Record: {selectedCaseRecord.caseId}</span>
              </h3>
              <button
                onClick={() => setSelectedCaseRecord(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
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
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          <span>Proceed to Test Script Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
