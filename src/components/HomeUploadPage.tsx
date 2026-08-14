import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileArchive, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  RotateCcw,
  Sparkles,
  Layers,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Bot
} from 'lucide-react';
import { AppState } from '../types';
import { uploadDocuments, uploadCodebase, ApiError } from '../services/apiClient';

interface HomeUploadPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
  onProceedToUnderstanding: () => void;
  onCreateNewRun: () => void;
}

export const HomeUploadPage: React.FC<HomeUploadPageProps> = ({
  appState,
  onRefreshStatus,
  onProceedToUnderstanding,
  onCreateNewRun
}) => {
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  const [docError, setDocError] = useState<Error | null>(null);
  const [zipError, setZipError] = useState<Error | null>(null);

  const [docSuccess, setDocSuccess] = useState<string | null>(null);
  const [zipSuccess, setZipSuccess] = useState<string | null>(null);

  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const [docsCollapsed, setDocsCollapsed] = useState(false);
  const [zipCollapsed, setZipCollapsed] = useState(false);
  const [showDocFiles, setShowDocFiles] = useState(false);
  const [showZipSteps, setShowZipSteps] = useState(false);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';
  const progress = appState?.progress || 0;
  const manifest = appState?.intake_manifest;
  const zipProcessing = appState?.launcher_state?.zip_processing;

  const statusToAgent: Record<string, string> = {
    idle: 'Intake Coordinator',
    uploading: 'Document Intake Agent',
    processing_zip: 'ZIP Processing Agent',
    indexing: 'Source Inventory Agent',
    ai_understanding_running: 'Understanding Agent',
    understanding_ready: 'Understanding Agent',
    error: 'Recovery / Diagnostics Agent',
  };
  const activeAgent = statusToAgent[currentStatus] || 'Intake Coordinator';

  const scrollToTarget = (targetId: string) => {
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  };

  // Handle doc drop or select
  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    setDocFiles(selected);
    await performDocUpload(selected);
  };

  const performDocUpload = async (files: File[]) => {
    if (!runId) return;
    setUploadingDocs(true);
    setDocError(null);
    setDocSuccess(null);
    try {
      const res = await uploadDocuments(runId, files);
      setDocSuccess(`Successfully uploaded ${res.uploaded_count} requirement document(s).`);
      setDocsCollapsed(true);
      onRefreshStatus();
      scrollToTarget('zip-upload-card');
    } catch (err: any) {
      setDocError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDocDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingDocs(false);
    if (uploadingDocs || !e.dataTransfer.files.length) return;
    const selected = Array.from(e.dataTransfer.files);
    setDocFiles(selected);
    await performDocUpload(selected);
  };

  // Handle ZIP drop or select
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = e.target.files[0];
    if (!selected.name.endsWith('.zip')) {
      setZipError(new Error('Invalid file format. Please upload a .zip archive.'));
      return;
    }
    setZipFile(selected);
    await performZipUpload(selected);
  };

  const performZipUpload = async (file: File) => {
    if (!runId) return;
    setUploadingZip(true);
    setZipError(null);
    setZipSuccess(null);
    try {
      const res = await uploadCodebase(runId, file);
      setZipSuccess(`Codebase ZIP uploaded and indexed (${res.intake_manifest.total_files} files extracted).`);
      setZipCollapsed(true);
      onRefreshStatus();
      scrollToTarget('zip-processing-summary');
    } catch (err: any) {
      setZipError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setUploadingZip(false);
    }
  };

  const handleZipDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingZip(false);
    if (uploadingZip || !e.dataTransfer.files.length) return;
    const selected = e.dataTransfer.files[0];
    if (!selected.name.endsWith('.zip')) {
      setZipError(new Error('Invalid file format. Please upload a .zip archive.'));
      return;
    }
    setZipFile(selected);
    await performZipUpload(selected);
  };

  const isIntakeReady = Boolean(
    manifest && (manifest.total_files > 0 || (manifest.doc_files && manifest.doc_files.length > 0))
  );

  const stages = [
    { key: 'idle', label: 'Idle / Run Created' },
    { key: 'uploading', label: 'Intake Uploading' },
    { key: 'processing_zip', label: 'Extracting ZIP Archive' },
    { key: 'indexing', label: 'Codebase Indexing Complete' },
    { key: 'ai_understanding_running', label: 'AI Understanding Running' },
    { key: 'understanding_ready', label: 'Understanding Ready' },
  ];

  const renderUploadError = (err: Error) => {
    const apiErr = err instanceof ApiError ? err : null;
    return (
      <div className="rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs animate-fade-in overflow-hidden">
        <div className="p-3 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <span>{err.message}</span>
            {apiErr?.error_code && (
              <div className="font-mono text-[10px] text-rose-400/80">error_code: {apiErr.error_code}</div>
            )}
          </div>
        </div>
        {apiErr?.diagnostics && (
          <pre className="bg-slate-950/80 border-t border-rose-900/50 p-2.5 text-[10px] font-mono text-rose-200/90 overflow-x-auto">
            {JSON.stringify(apiErr.diagnostics, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Agent header */}
      <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-700/50 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>F01 Home Upload Experience</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Execution Workspace</h2>
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs">
              <Bot className="h-3.5 w-3.5 text-teal-300" />
              <span className="text-slate-400">Active Agent:</span>
              <span className="font-semibold text-teal-300">{activeAgent}</span>
            </div>
          </div>

          <div className="space-y-2 text-right text-xs">
            <div className="text-slate-400">Current Run</div>
            <code className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-cyan-300">{runId || 'Initializing...'}</code>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onCreateNewRun}
                className="inline-flex items-center space-x-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Run</span>
              </button>
              <button
                onClick={onRefreshStatus}
                className="inline-flex items-center space-x-2 rounded-md border border-teal-700/50 bg-teal-950/30 px-3 py-1.5 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-900/40"
              >
                <Loader2 className={`h-3.5 w-3.5 ${currentStatus.includes('running') ? 'animate-spin' : ''}`} />
                <span>Poll Status</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Run lifecycle timeline near top */}
      <div id="run-timeline" className="rounded-lg border border-slate-700 bg-slate-900/70 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-teal-300" />
            <h3 className="text-sm font-bold text-slate-100">Run Cycle Status Timeline</h3>
          </div>
          <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono font-bold text-teal-300">{progress}%</span>
        </div>

        <div className="w-full overflow-hidden rounded-full border border-slate-700 bg-slate-950 h-2">
          <div className="relative h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}>
            {currentStatus.includes('running') && (
              <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)', backgroundSize: '400px 100%' }} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {stages.map((st, idx) => {
            const isCompleted = progress >= (idx + 1) * 16.6;
            const isCurrent = currentStatus === st.key;

            return (
              <div
                key={st.key}
                className={`rounded-md border p-3 text-center text-xs transition-all ${
                  isCurrent
                    ? 'border-teal-500/70 bg-teal-950/40 text-teal-300 ring-1 ring-teal-500/30'
                    : isCompleted
                      ? 'border-slate-700 bg-slate-900 text-slate-300'
                      : 'border-slate-800 bg-slate-950/70 text-slate-500'
                }`}
              >
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-70">Stage 0{idx + 1}</div>
                <div className="font-semibold leading-tight">{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div id="doc-upload-card" className={`rounded-lg bg-slate-900/80 border border-slate-700 ${docsCollapsed ? 'p-4' : 'p-6'} transition-all shadow-lg`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">1. Requirement Specifications</h3>
                  <p className="text-xs text-slate-400">Count-first view. Expand only if you want file names.</p>
                </div>
              </div>
              {docSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>

            {!docsCollapsed && (
              <label
                onDragOver={(e) => { e.preventDefault(); if (!uploadingDocs) setIsDraggingDocs(true); }}
                onDragLeave={() => setIsDraggingDocs(false)}
                onDrop={handleDocDrop}
                className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-md cursor-pointer transition-all p-4 text-center group ${
                  isDraggingDocs
                    ? 'border-indigo-400 bg-indigo-950/30'
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".md,.pdf,.txt,.docx"
                  onChange={handleDocSelect}
                  className="hidden"
                  disabled={uploadingDocs}
                />
                <UploadCloud className={`w-8 h-8 text-indigo-300 mb-2 transition-transform ${isDraggingDocs ? 'scale-110' : 'group-hover:scale-110'}`} />
                <p className="text-xs font-semibold text-slate-200">
                  {uploadingDocs ? 'Uploading documents...' : isDraggingDocs ? 'Release to upload' : 'Click or Drag & Drop Requirement Docs'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports Markdown, PDF, Text, and Word</p>
              </label>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs">
              <div className="text-slate-400">Uploaded documents: <span className="font-mono font-bold text-teal-300">{manifest?.doc_files?.length || 0}</span></div>
              <div className="flex items-center gap-2">
                {docsCollapsed ? (
                  <button onClick={() => setDocsCollapsed(false)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:text-slate-100">
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Expand</span>
                  </button>
                ) : (
                  <button onClick={() => setDocsCollapsed(true)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:text-slate-100">
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Compact</span>
                  </button>
                )}
                <button onClick={() => setShowDocFiles((prev) => !prev)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:text-slate-100">
                  {showDocFiles ? 'Hide Files' : 'Show Files'}
                </button>
              </div>
            </div>

            {docSuccess && (
              <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{docSuccess}</span>
              </div>
            )}

            {docError && renderUploadError(docError)}

            {showDocFiles && manifest?.doc_files && manifest.doc_files.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uploaded Documents ({manifest.doc_files.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {manifest.doc_files.map((df, i) => (
                    <span key={i} className="text-xs bg-slate-950 text-slate-300 px-2 py-1 rounded-md border border-slate-800 font-mono">
                      {df}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div id="zip-upload-card" className={`rounded-lg bg-slate-900/80 border border-slate-700 ${zipCollapsed ? 'p-4' : 'p-6'} transition-all shadow-lg`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-300">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">2. Target Application Codebase</h3>
                  <p className="text-xs text-slate-400">Count-first view with optional details.</p>
                </div>
              </div>
              {zipSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>

            {!zipCollapsed && (
              <label
                onDragOver={(e) => { e.preventDefault(); if (!uploadingZip) setIsDraggingZip(true); }}
                onDragLeave={() => setIsDraggingZip(false)}
                onDrop={handleZipDrop}
                className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-md cursor-pointer transition-all p-4 text-center group ${
                  isDraggingZip
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-700 hover:border-cyan-500 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipSelect}
                  className="hidden"
                  disabled={uploadingZip}
                />
                <FileArchive className={`w-8 h-8 text-cyan-300 mb-2 transition-transform ${isDraggingZip ? 'scale-110' : 'group-hover:scale-110'}`} />
                <p className="text-xs font-semibold text-slate-200">
                  {uploadingZip ? 'Extracting & Indexing ZIP...' : isDraggingZip ? 'Release to upload' : 'Click or Drag & Drop Source Code ZIP'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Accepts React, TypeScript, Python, HTML source archives</p>
              </label>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs">
              <div className="text-slate-400">Extracted files: <span className="font-mono font-bold text-teal-300">{manifest?.total_files || 0}</span></div>
              <div className="flex items-center gap-2">
                {zipCollapsed ? (
                  <button onClick={() => setZipCollapsed(false)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:text-slate-100">
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Expand</span>
                  </button>
                ) : (
                  <button onClick={() => setZipCollapsed(true)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:text-slate-100">
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Compact</span>
                  </button>
                )}
              </div>
            </div>

            {zipSuccess && (
              <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{zipSuccess}</span>
              </div>
            )}

            {zipError && renderUploadError(zipError)}

            {manifest && manifest.total_files > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Extracted Files Count:</span>
                  <span className="font-mono text-teal-300 font-bold">{manifest.total_files} files</span>
                </div>
                {typeof manifest.excluded_file_count === 'number' && manifest.excluded_file_count > 0 && (
                  <div className="flex justify-between">
                    <span>Excluded Noise / Unsafe Files:</span>
                    <span className="font-mono text-amber-300 font-bold">{manifest.excluded_file_count} files</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Code Size:</span>
                  <span className="font-mono text-slate-300">{(manifest.total_size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {zipProcessing && zipProcessing.decisions.length > 0 && (
        <div id="zip-processing-summary" className="rounded-lg bg-slate-900/80 border border-slate-700 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">ZIP Intake Process Sub-Steps</h3>
              <p className="text-xs text-slate-400">Summary first. Expand details only when needed.</p>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1">
              <div>Step: <span className="font-mono text-teal-300">{zipProcessing.current_step}</span></div>
              <div>AI reviews: <span className="font-mono text-indigo-300">{zipProcessing.reviewed_by_ai_count}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="text-slate-500">ZIP Members</div>
              <div className="font-mono font-bold text-slate-200">{zipProcessing.total_members}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="text-slate-500">Included</div>
              <div className="font-mono font-bold text-emerald-300">{zipProcessing.included_count}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="text-slate-500">Excluded</div>
              <div className="font-mono font-bold text-amber-300">{zipProcessing.excluded_count}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="text-slate-500">AI Reviewed</div>
              <div className="font-mono font-bold text-teal-300">{zipProcessing.reviewed_by_ai_count}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowZipSteps((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-slate-100"
            >
              {showZipSteps ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showZipSteps ? 'Collapse Details' : 'Expand Details'}</span>
            </button>
          </div>

          {showZipSteps && (
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80">
              <div className="grid grid-cols-[minmax(0,1.5fr)_90px_110px_120px] gap-3 border-b border-slate-800 px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">
                <span>File</span>
                <span>Decision</span>
                <span>Reason</span>
                <span>Source</span>
              </div>
              {zipProcessing.decisions.slice(0, 120).map((decision, index) => (
                <div key={`${decision.rel_path}-${index}`} className="grid grid-cols-[minmax(0,1.5fr)_90px_110px_120px] gap-3 border-b border-slate-900/80 px-4 py-3 text-xs text-slate-300 last:border-b-0">
                  <span className="truncate font-mono" title={decision.rel_path}>{decision.rel_path}</span>
                  <span className={decision.decision === 'include' ? 'text-emerald-300' : 'text-amber-300'}>{decision.decision}</span>
                  <span className="truncate text-slate-400" title={decision.reason}>{decision.reason}</span>
                  <span className="uppercase text-slate-500">{decision.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          id="proceed-understanding-btn"
          onClick={onProceedToUnderstanding}
          disabled={!isIntakeReady}
          className={`
            inline-flex items-center space-x-3 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg
            ${isIntakeReady 
              ? 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 text-white hover:opacity-95 shadow-cyan-500/25 cursor-pointer hover:scale-[1.01]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'}
          `}
        >
          <span>Proceed to Understanding Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
