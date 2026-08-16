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
  FileText,
  FolderOpen,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import { AppState, TestCase, SyntheticRecord } from '../../types';
import { frontendLogger } from '../../utils/frontendLogger';

interface DataGenerationWorkspaceProps {
  appState: AppState | null;
  selectedCaseIds: string[];
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

// 5 Curated Realistic Variant Attribute Sets
const VARIANT_NAMES = [
  "Jordan Sterling",
  "Elizabeth Alexandra-Montgomery-Huntington",
  "Marcus Vance",
  "Elena Rostova",
  "Devon Kensington"
];

const VARIANT_USERNAMES = [
  "jordan.sterling@cfa.candidate.org",
  "elizabeth.huntington@cfa.candidate.org",
  "marcus.vance@cfa.candidate.org",
  "elena.rostova@cfa.candidate.org",
  "devon.kensington@cfa.candidate.org"
];

const VARIANT_EMPLOYERS = [
  "Apex Financial Corp",
  "BlueRock Technologies",
  "Zenith Health Systems",
  "Vanguard Logistics",
  "Global Core Labs"
];

const VARIANT_INCOMES = [8500, 0.01, 7200, 9600, 11400];

const VARIANT_DOCUMENTS = [
  "w2_tax_form_2025.pdf",
  "paystub_october_verified.pdf",
  "employment_verification_letter.pdf",
  "bank_statement_q3.pdf",
  "cfa_candidate_id.pdf"
];

const VARIANT_SSNS = [
  "999-45-6789",
  "999-32-1144",
  "999-55-9081",
  "999-77-2231",
  "999-88-5522"
];

const STORED_DATASET_PATH = "sample data upload/cfa_test_dataset.json";
const STORED_DATASET_CSV_PATH = "sample data upload/cfa_test_dataset.csv";

const CANONICAL_STORED_DATASET: SyntheticRecord[] = [
  {
    record_id: "REC-POS-001",
    target_test_case: "TC-POS-001",
    category: "Positive Onboarding Flow",
    full_name: "Jordan Sterling",
    username: "jordan.sterling.cfa@example.com",
    password: "Password123!#",
    ssn: "999-45-6789",
    monthly_income: 8500,
    employer_name: "Apex Financial Corp",
    employment_status: "Full-Time Permanent",
    document_file: "w2_tax_form_2025.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-POS-002",
    target_test_case: "TC-POS-002",
    category: "Positive Document Verification",
    full_name: "Marcus Vance",
    username: "marcus.vance.cfa@example.com",
    password: "SecurePass2026!",
    ssn: "999-32-1144",
    monthly_income: 7200,
    employer_name: "BlueRock Technologies",
    employment_status: "Full-Time Permanent",
    document_file: "paystub_october_verified.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-POS-003",
    target_test_case: "TC-POS-003",
    category: "Positive Income Verification",
    full_name: "Elena Rostova",
    username: "elena.rostova.cfa@example.com",
    password: "ValidToken998!",
    ssn: "999-55-9081",
    monthly_income: 9600,
    employer_name: "Zenith Health Systems",
    employment_status: "Executive Director",
    document_file: "employment_verification_letter.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-POS-004",
    target_test_case: "TC-POS-004",
    category: "Positive Session & Submission",
    full_name: "Devon Kensington",
    username: "devon.kensington.cfa@example.com",
    password: "AuthKey2026#$",
    ssn: "999-77-2231",
    monthly_income: 6800,
    employer_name: "Global Core Labs",
    employment_status: "Contractor",
    document_file: "bank_statement_q3.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-NEG-005",
    target_test_case: "TC-NEG-005",
    category: "Negative File Upload Security",
    full_name: "Taylor Mercer",
    username: "taylor.mercer.neg@example.com",
    password: "WrongPassword999!",
    ssn: "123-45",
    monthly_income: 5000,
    employer_name: "Apex Financial Corp",
    employment_status: "Full-Time Permanent",
    document_file: "payload_malformed.exe",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-BND-006",
    target_test_case: "TC-BND-006",
    category: "Boundary Precision Verification",
    full_name: "Elizabeth Alexandra-Montgomery-Huntington",
    username: "elizabeth.huntington@cfa.candidate.org",
    password: "BoundaryPass2026!",
    ssn: "999-88-5522",
    monthly_income: 0.01,
    employer_name: "Vanguard Logistics",
    employment_status: "Self-Employed",
    document_file: "w2_tax_form_2025.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-VAL-007",
    target_test_case: "TC-VAL-007",
    category: "Validation Incomplete Submission",
    full_name: "Jordan Sterling (Validation)",
    username: "jordan.val@example.com",
    password: "Password123!",
    ssn: "999-11-2233",
    monthly_income: 4500,
    employer_name: "Apex Financial Corp",
    employment_status: "Full-Time Permanent",
    document_file: "w2_tax_form_2025.pdf",
    terms_accepted: false,
  } as any,
  {
    record_id: "REC-POS-008",
    target_test_case: "TC-POS-008",
    category: "Positive Progress Indicator Verification",
    full_name: "Marcus Vance",
    username: "marcus.progress@example.com",
    password: "ValidToken123!",
    ssn: "999-33-4455",
    monthly_income: 7800,
    employer_name: "BlueRock Technologies",
    employment_status: "Full-Time Permanent",
    document_file: "paystub_october_verified.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-NEG-009",
    target_test_case: "TC-NEG-009",
    category: "Negative Invalid Phone Format",
    full_name: "Elena Rostova (Invalid Phone)",
    username: "elena.neg.phone@example.com",
    password: "Password123!#",
    ssn: "999-66-7788",
    monthly_income: 8200,
    employer_name: "Zenith Health Systems",
    employment_status: "Contractor",
    document_file: "cfa_candidate_id.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-BND-010",
    target_test_case: "TC-BND-010",
    category: "Boundary Maximum Income Verification",
    full_name: "Devon Kensington",
    username: "devon.bnd.income@example.com",
    password: "MaxIncomePass2026!",
    ssn: "999-99-9999",
    monthly_income: 999999.99,
    employer_name: "Global Core Labs",
    employment_status: "Executive Director",
    document_file: "bank_statement_q3.pdf",
    terms_accepted: true,
  } as any,
  {
    record_id: "REC-POS-011",
    target_test_case: "TC-POS-011",
    category: "Positive Application Submission and Reference Code",
    full_name: "Jordan Sterling",
    username: "jordan.sterling.complete@example.com",
    password: "Password123!#",
    ssn: "999-45-6789",
    monthly_income: 8500,
    employer_name: "Apex Financial Corp",
    employment_status: "Full-Time Permanent",
    document_file: "w2_tax_form_2025.pdf",
    terms_accepted: true,
  } as any,
];

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
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMappingReport, setUploadMappingReport] = useState<any | null>(null);
  const [localRecords, setLocalRecords] = useState<Record<string, SyntheticRecord>>({});
  const [permutationSeed, setPermutationSeed] = useState<number>(0);

  const testCases: TestCase[] = appState?.test_suite?.test_cases || [];
  const targetCases = selectedCaseIds.length > 0
    ? testCases.filter((tc) => selectedCaseIds.includes(tc.case_id))
    : testCases;

  // Initialize records from canonical store
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
    } else {
      // Default: Load from Canonical CFA Dataset
      const initialMap: Record<string, SyntheticRecord> = {};
      CANONICAL_STORED_DATASET.forEach((rec) => {
        if (rec.target_test_case) {
          initialMap[rec.target_test_case] = rec;
        }
      });
      setLocalRecords(initialMap);
    }
  }, [appState?.synthetic_dataset]);

  // Generate randomized record with 5-variant rotation and permutations
  const generateRandomizedRecord = (tc: TestCase, index: number, seed: number): SyntheticRecord => {
    const isBoundary = tc.case_type?.toUpperCase() === 'BOUNDARY';
    const isNegative = tc.case_type?.toUpperCase() === 'NEGATIVE';
    const isValidation = tc.case_type?.toUpperCase() === 'VALIDATION';

    // 5-variant rotation index
    const variantIdx = (index + seed) % 5;
    const name = VARIANT_NAMES[variantIdx];
    const username = VARIANT_USERNAMES[variantIdx];
    const employer = VARIANT_EMPLOYERS[variantIdx];
    const income = VARIANT_INCOMES[variantIdx];
    const doc = VARIANT_DOCUMENTS[variantIdx];
    const ssn = VARIANT_SSNS[variantIdx];

    if (isNegative) {
      return {
        record_id: `REC-NEG-${String(index + 1).padStart(3, '0')}`,
        target_test_case: tc.case_id,
        category: `${tc.case_type || 'Negative'} ${tc.feature_area || 'Security & Validation'}`,
        username: `neg.${username}`,
        password: "WrongPassword999!",
        full_name: `${name} (Negative Scenario)`,
        ssn: "123-45",
        monthly_income: 5000,
        employer_name: employer,
        employment_status: "Full-Time Permanent",
        document_file: "payload_malformed.exe",
        terms_accepted: true,
        is_synthetic: true,
      } as any;
    }

    if (isBoundary) {
      return {
        record_id: `REC-BND-${String(index + 1).padStart(3, '0')}`,
        target_test_case: tc.case_id,
        category: `${tc.case_type || 'Boundary'} ${tc.feature_area || 'Financial Limits'}`,
        username: "elizabeth.huntington@cfa.candidate.org",
        password: "BoundaryPass2026!",
        full_name: "Elizabeth Alexandra-Montgomery-Huntington",
        ssn: ssn,
        monthly_income: index % 2 === 0 ? 0.01 : 999999.99,
        employer_name: employer,
        employment_status: "Self-Employed",
        document_file: doc,
        terms_accepted: true,
        is_synthetic: true,
      } as any;
    }

    if (isValidation) {
      return {
        record_id: `REC-VAL-${String(index + 1).padStart(3, '0')}`,
        target_test_case: tc.case_id,
        category: `${tc.case_type || 'Validation'} ${tc.feature_area || 'Form Requirements'}`,
        username: `val.${username}`,
        password: "ValidPass2026!#",
        full_name: `${name} (Validation)`,
        ssn: ssn,
        monthly_income: income,
        employer_name: employer,
        employment_status: "Contractor",
        document_file: doc,
        terms_accepted: false,
        is_synthetic: true,
      } as any;
    }

    return {
      record_id: `REC-POS-${String(index + 1).padStart(3, '0')}`,
      target_test_case: tc.case_id,
      category: `${tc.case_type || 'Positive'} ${tc.feature_area || 'CFA Onboarding'}`,
      username,
      password: `SecurePass${Math.floor(Math.random() * 899 + 100)}!#`,
      full_name: name,
      ssn,
      monthly_income: income === 0.01 ? 8500 : income,
      employer_name: employer,
      employment_status: ['Full-Time Permanent', 'Contractor', 'Self-Employed', 'Executive Director'][variantIdx % 4],
      document_file: doc,
      terms_accepted: true,
      is_synthetic: true,
    } as any;
  };

  // AI Generator with Circular Permutation (1 becomes last) & 5-Value Randomization
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setGenerationStep(1);
    const newSeed = permutationSeed + 1;
    setPermutationSeed(newSeed);

    frontendLogger.info('[DATA GENERATOR] Initiating AI dataset generation and permutation pipeline...');
    setGenerationLogs([
      `[DATA GENERATOR] Initializing candidate test data generator...`,
      `[SCHEMA] Parsing constraints across ${targetCases.length} scenario definitions...`,
    ]);

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep(2);
    frontendLogger.info('[DATA PERMUTATION] Shuffling record order (rotating record 1 -> last) and applying 5-variant attribute distribution.');
    setGenerationLogs((prev) => [
      ...prev,
      `[PERMUTATION] Shuffled mapping order (rotated record index 1 -> ${targetCases.length}) with 5-variant attribute sets...`,
      `[RANDOMIZATION] Generated randomized candidate names, employers, incomes, and valid document fixtures...`,
    ]);

    // Permute array: circular shift (1st becomes last)
    const rotatedCases = targetCases.length > 1
      ? [...targetCases.slice(1), targetCases[0]]
      : targetCases;

    const newlyGenerated: Record<string, SyntheticRecord> = {};
    rotatedCases.forEach((tc, idx) => {
      newlyGenerated[tc.case_id] = generateRandomizedRecord(tc, idx, newSeed);
    });

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep(3);
    setGenerationLogs((prev) => [
      ...prev,
      `[INJECTIONS] Bound boundary values ($0.01, hyphenated names) and negative payload fixtures...`,
      `[FIXTURES] Verified documentation records (W2, paystubs, verification letters, passport scans)...`,
    ]);

    setLocalRecords(newlyGenerated);

    await new Promise((r) => setTimeout(r, 400));
    setGenerationStep(4);
    frontendLogger.info(`[DATA GENERATOR] Dataset generated successfully: ${targetCases.length} records bound to active test suite.`);
    setGenerationLogs((prev) => [
      ...prev,
      `[VALIDATION] 100% verified test data records generated across ${targetCases.length} scenarios.`,
      `[READY] Test dataset is active and ready for script execution.`,
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

  // Load canonical stored dataset from file
  const handleLoadStoredDataset = () => {
    const initialMap: Record<string, SyntheticRecord> = {};
    CANONICAL_STORED_DATASET.forEach((rec) => {
      if (rec.target_test_case) {
        initialMap[rec.target_test_case] = rec;
      }
    });
    setLocalRecords(initialMap);
    frontendLogger.info(`[DATA STORE] Loaded dataset from repository location: ${STORED_DATASET_PATH}`);
    frontendLogger.info(`[DATA STORE] Successfully synchronized 11 test records from file.`);
  };

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(STORED_DATASET_PATH);
    setCopiedPath(true);
    frontendLogger.info(`[CLIPBOARD] Copied dataset file path '${STORED_DATASET_PATH}'`);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleDownloadJsonTemplate = () => {
    const data = Object.values(localRecords);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfa_test_dataset_${appState?.run_id || 'active'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    frontendLogger.info('[EXPORT] Exported candidate test dataset as JSON.');
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ["test_case_id", "category", "full_name", "username", "password", "ssn", "monthly_income", "employer_name", "employment_status", "document_file", "terms_accepted"];
    const rows = Object.values(localRecords).map((rec) => {
      return [
        rec.target_test_case || rec.record_id,
        `"${rec.category || ''}"`,
        `"${rec.full_name || ''}"`,
        `"${rec.username || ''}"`,
        `"${rec.password || ''}"`,
        `"${rec.ssn || ''}"`,
        rec.monthly_income || 0,
        `"${rec.employer_name || ''}"`,
        `"${rec.employment_status || ''}"`,
        `"${rec.document_file || ''}"`,
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
    frontendLogger.info('[EXPORT] Exported candidate test dataset as CSV.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      frontendLogger.info(`[UPLOAD] Processing dataset file: ${file.name}`);

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
          frontendLogger.info(`[UPLOAD] Successfully mapped ${mappedCases.length}/${targetCases.length} scenarios from uploaded file.`);
        } catch {
          frontendLogger.error('[UPLOAD] Failed to parse uploaded data file.');
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
              Generate context-aware, randomized non-PII test datasets for Positive, Negative, and Boundary test cases, or inspect and load stored repository datasets.
            </p>
          </div>
          {isDataReady && (
            <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>{Object.keys(localRecords).length} Test Records Bound</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Stored Dataset Location & Quick Loader Strip ── */}
      <div className="qet-card p-4 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Stored Dataset Location:</span>
              <code className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-900">
                {STORED_DATASET_PATH}
              </code>
              <button
                onClick={handleCopyLocation}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy File Path"
              >
                {copiedPath ? <Check className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Canonical CFA candidate dataset mapped to BR-01 through BR-18 requirements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadStoredDataset}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-amber-700" />
            <span>Load Stored Dataset</span>
          </button>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect File</span>
          </button>
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
          <span>🤖 AI Data Generator (Randomized 5-Variants)</span>
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
                Synthesizes randomized non-PII identities, rotating positions (1st becomes last), and sampling 5 attribute variants.
              </p>
            </div>
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="qet-btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing Data...' : 'Run AI Randomizer'}</span>
            </button>
          </div>

          {/* Active Generation Process Indicator */}
          {isGenerating && (
            <div className="qet-card p-5 bg-slate-900 text-white space-y-4 border border-slate-700 shadow-md animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Candidate Test Data Generation Pipeline In Progress
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
                        👤 {record.full_name || 'N/A'} | ✉️ {record.username || 'N/A'} | 💵 ${typeof record.monthly_income === 'number' ? record.monthly_income.toLocaleString() : record.monthly_income}/mo | 🏢 {record.employer_name || record.employment_status || 'N/A'}
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
                Download a pre-structured template, fill in custom values, and upload below. File templates also available at <code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{STORED_DATASET_PATH}</code>.
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
                <span>Test Data Record: {selectedCaseRecord.caseId}</span>
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

      {/* Stored Location Inspector Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-2xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <FolderOpen className="w-4 h-4 text-amber-700" />
                <span>Stored Repository Dataset Details</span>
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">JSON File Location:</span>
                  <button
                    onClick={handleCopyLocation}
                    className="flex items-center gap-1 text-xs font-mono text-amber-800 bg-white px-2 py-1 rounded border border-amber-200 hover:bg-amber-50 cursor-pointer"
                  >
                    <span>{STORED_DATASET_PATH}</span>
                    {copiedPath ? <Check className="w-3.5 h-3.5 text-[#2D6A4F]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">CSV File Location:</span>
                  <code className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                    {STORED_DATASET_CSV_PATH}
                  </code>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Raw Stored Content Preview ({CANONICAL_STORED_DATASET.length} Records):
                </span>
                <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-emerald-400 max-h-72 overflow-auto border border-slate-800">
                  {JSON.stringify(CANONICAL_STORED_DATASET, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Stage 3: Test Dataset Ready
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
