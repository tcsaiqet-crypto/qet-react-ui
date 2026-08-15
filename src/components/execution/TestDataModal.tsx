import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Database, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  CheckCircle2,
  Table as TableIcon,
  Code as CodeIcon
} from 'lucide-react';
import { SyntheticDataset, SyntheticRecord, TestCase } from '../../types';

interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase?: TestCase | null;
  syntheticDataset?: SyntheticDataset | null;
}

export const TestDataModal: React.FC<TestDataModalProps> = ({
  isOpen,
  onClose,
  testCase,
  syntheticDataset,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !testCase) return null;

  // Find records mapped to this specific test case
  const caseId = testCase.case_id;
  const mappedRecords: SyntheticRecord[] = 
    syntheticDataset?.test_case_id_mapping?.[caseId] || 
    syntheticDataset?.records?.filter(r => r.target_test_case === caseId) || 
    [];

  // If no mapped record found, generate a representative synthetic record for display
  const displayRecords: SyntheticRecord[] = mappedRecords.length > 0 ? mappedRecords : [
    {
      record_id: `REC-${testCase.case_type.slice(0, 3).toUpperCase()}-001`,
      target_test_case: caseId,
      category: `${testCase.case_type} ${testCase.feature_area}`,
      username: testCase.case_type === 'Negative' ? 'invalid.user@badformat' : `candidate.${testCase.case_id.toLowerCase().replace(/-/g, '')}@fictional-domain.org`,
      password: testCase.case_type === 'Negative' ? 'WrongPassword123!' : 'ValidPassword2026!',
      full_name: testCase.case_type === 'Negative' ? 'Test Negative User' : 'Alex Fictional Candidate',
      ssn: testCase.case_type === 'Boundary' ? '000-00-0000' : '999-12-3456',
      monthly_income: testCase.case_type === 'Boundary' ? 0.00 : 7500.00,
      employment_status: 'Full-Time',
      document_file: testCase.case_type === 'Negative' ? 'unsupported_file.exe' : 'candidate_id_document.pdf',
      terms_accepted: testCase.case_type !== 'Negative',
      is_synthetic: true
    }
  ];

  const jsonString = JSON.stringify(displayRecords, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNegativeOrBoundary = testCase.case_type === 'Negative' || testCase.case_type === 'Boundary' || testCase.case_type === 'Error-Handling';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  {testCase.case_id}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Synthetic Test Data Record
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white truncate max-w-lg mt-0.5">
                {testCase.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  viewMode === 'json' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CodeIcon className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Copy mock data payload"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Disclaimer & Scenario Indicator */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                100% Fictional Non-PII Synthetic Dataset &middot; Mapped to <strong className="text-white">{testCase.feature_area}</strong>
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
              isNegativeOrBoundary ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
            }`}>
              {testCase.case_type} Scenario
            </span>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="space-y-4">
              {displayRecords.map((record, rIdx) => (
                <div key={rIdx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {record.record_id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Category: <span className="text-slate-200">{record.category}</span>
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/40 font-medium">
                        <th className="p-3 w-1/3">Field / Parameter</th>
                        <th className="p-3 w-1/2">Synthetic Value</th>
                        <th className="p-3 text-right">Data Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(record)
                        .filter(([k]) => k !== 'record_id' && k !== 'target_test_case' && k !== 'category' && k !== 'is_synthetic')
                        .map(([key, val], vIdx) => {
                          const isSpecial = (key === 'monthly_income' && (val === 0 || val > 50000)) ||
                                            (key === 'username' && String(val).includes('badformat')) ||
                                            (key === 'password' && String(val).includes('Wrong')) ||
                                            (key === 'terms_accepted' && val === false);

                          return (
                            <tr key={vIdx} className="hover:bg-slate-900/50 transition">
                              <td className="p-3 font-mono text-slate-400 font-medium">
                                {key}
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  isSpecial 
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold' 
                                    : 'text-slate-200'
                                }`}>
                                  {typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val)}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono text-slate-500 text-[11px]">
                                {typeof val}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            /* JSON View */
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto select-text">
              <pre>{jsonString}</pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            {displayRecords.length} mock record(s) &middot; Target: {testCase.case_id}
          </span>
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
