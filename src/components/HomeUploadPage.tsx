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
  Bot,
  FileCode,
  Check,
  RefreshCw,
  PlusCircle
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

  const [forceExpandDocs, setForceExpandDocs] = useState(false);
  const [forceExpandZip, setForceExpandZip] = useState(false);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';
  const progress = appState?.progress || 0;
  const manifest = appState?.intake_manifest;

  const hasDocsUploaded = Boolean(manifest?.doc_files && manifest.doc_files.length > 0);
  const hasZipUploaded = Boolean(manifest && manifest.total_files > 0);

  const statusToAgent: Record<string, string> = {
    idle: 'Requirement Understanding Agent',
    uploading: 'Document Intake Agent',
    processing_zip: 'ZIP Processing Agent',
    indexing: 'Source Inventory Agent',
    ai_understanding_running: 'Understanding Agent',
    understanding_ready: 'Understanding Agent',
    error: 'Recovery / Diagnostics Agent',
  };
  const activeAgent = statusToAgent[currentStatus] || 'Requirement Understanding Agent';

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
      setDocSuccess(`Successfully indexed ${res.uploaded_count} requirement document(s).`);
      setForceExpandDocs(false);
      onRefreshStatus();
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
      setZipSuccess(`Archive unpacked: ${res.intake_manifest.total_files} files indexed.`);
      setForceExpandZip(false);
      onRefreshStatus();
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
    { key: 'processing_zip', label: 'Extracting ZIP' },
    { key: 'indexing', label: 'Codebase Indexed' },
    { key: 'ai_understanding_running', label: 'AI Understanding' },
    { key: 'understanding_ready', label: 'Analysis Ready' },
  ];

  const renderUploadError = (err: Error) => {
    const apiErr = err instanceof ApiError ? err : null;
    return (
      <div className="qet-badge-danger p-3 text-xs space-y-1.5 animate-file-item">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{err.message}</span>
            {apiErr?.error_code && (
              <div className="font-mono text-[10px] mt-0.5 opacity-85">error_code: {apiErr.error_code}</div>
            )}
          </div>
        </div>
        {apiErr?.diagnostics && (
          <pre className="p-2 rounded font-mono text-[10px] overflow-x-auto" style={{ backgroundColor: 'var(--qet-surface)' }}>
            {JSON.stringify(apiErr.diagnostics, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Execution Workspace Header ────────────────────────────── */}
      <div className="qet-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold qet-badge-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>F01 Home Upload Experience</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--qet-text-primary)' }}>
              Execution Workspace
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg qet-card-elevated">
              <Bot className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
              <span style={{ color: 'var(--qet-text-muted)' }}>Active Agent:</span>
              <span className="font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                {activeAgent}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <button
              onClick={onCreateNewRun}
              className="qet-btn-secondary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Run</span>
            </button>
            <button
              onClick={onRefreshStatus}
              className="qet-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Loader2 className={`h-3.5 w-3.5 ${currentStatus.includes('running') ? 'animate-spin' : ''}`} />
              <span>Poll Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Run Cycle Status Timeline ───────────────────────────── */}
      <div className="qet-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
              Run Cycle Status Timeline
            </h3>
          </div>
          <span className="qet-badge-accent px-2.5 py-1 text-xs font-mono font-bold">
            {progress}% Complete
          </span>
        </div>

        {/* Progress Track */}
        <div
          className="w-full overflow-hidden rounded-full h-2"
          style={{ backgroundColor: 'var(--qet-surface-elevated)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(4, progress)}%`,
              backgroundColor: 'var(--qet-accent)',
            }}
          />
        </div>

        {/* 6 Stage Stepper Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {stages.map((st, idx) => {
            const isCompleted = progress >= (idx + 1) * 16.6;
            const isCurrent = currentStatus === st.key;

            return (
              <div
                key={st.key}
                className={`rounded-lg p-3 text-center text-xs transition-all ${
                  isCurrent
                    ? 'qet-badge-accent ring-2 ring-blue-500/40 shadow-sm'
                    : isCompleted
                    ? 'qet-badge-success'
                    : 'qet-card-elevated opacity-75'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {isCompleted ? <Check className="w-3 h-3 text-emerald-500" /> : null}
                  <span>Stage 0{idx + 1}</span>
                </div>
                <div className="font-semibold leading-tight">{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Vertical Step Rail: Requirement Understanding Agent ── */}
      <div className="qet-panel p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--qet-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
            >
              <Bot className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                Requirement Understanding Agent
              </h3>
              <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                Intake specifications, codebase architecture, and discover application testability.
              </p>
            </div>
          </div>
          <span className="qet-badge-neutral px-2.5 py-1 text-xs font-semibold">
            {isIntakeReady ? 'Intake Complete' : 'Awaiting Sources'}
          </span>
        </div>

        {/* Step 1: Requirement Documents */}
        <div className="qet-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
              >
                <FileText className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Step 1 &middot; Requirement Specifications
                </h4>
                <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                  Markdown, PDF, Word, or text requirement documents (.md, .pdf, .docx, .txt)
                </p>
              </div>
            </div>
            {hasDocsUploaded && !forceExpandDocs ? (
              <span className="qet-badge-success px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{manifest?.doc_files?.length || 0} Docs Indexed</span>
              </span>
            ) : null}
          </div>

          {/* Compact Summary View after upload */}
          {hasDocsUploaded && !forceExpandDocs ? (
            <div className="qet-card-elevated p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-file-item">
              <div className="flex items-center gap-2 flex-wrap max-w-2xl">
                {manifest?.doc_files?.map((df, i) => (
                  <span
                    key={i}
                    className="qet-badge-neutral px-2.5 py-1 text-xs font-mono font-medium inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{df}</span>
                  </span>
                ))}
              </div>
              <button
                onClick={() => setForceExpandDocs(true)}
                className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace / Add Docs</span>
              </button>
            </div>
          ) : (
            /* Expanded Dropzone */
            <label
              onDragOver={(e) => { e.preventDefault(); if (!uploadingDocs) setIsDraggingDocs(true); }}
              onDragLeave={() => setIsDraggingDocs(false)}
              onDrop={handleDocDrop}
              className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[140px] p-6 text-center cursor-pointer group ${
                isDraggingDocs ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              <input
                type="file"
                multiple
                accept=".md,.pdf,.txt,.docx,.doc"
                onChange={handleDocSelect}
                className="hidden"
                disabled={uploadingDocs}
              />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--qet-surface-elevated)' }}
              >
                {uploadingDocs ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--qet-accent)' }} />
                ) : (
                  <UploadCloud className="w-5 h-5" style={{ color: 'var(--qet-accent)' }} />
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                {uploadingDocs ? 'Uploading & Indexing Documents...' : isDraggingDocs ? 'Drop files now' : 'Click to Browse or Drag & Drop Documents'}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--qet-text-muted)' }}>
                Supports Markdown, PDF, Text, and Word (.md, .pdf, .txt, .docx)
              </p>
            </label>
          )}

          {docError && renderUploadError(docError)}
        </div>

        {/* Step 2: Target Codebase ZIP */}
        <div className="qet-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
              >
                <FileArchive className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Step 2 &middot; Target Application Codebase
                </h4>
                <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                  Source archive (.zip) containing React, TypeScript, Python, or HTML code
                </p>
              </div>
            </div>
            {hasZipUploaded && !forceExpandZip ? (
              <span className="qet-badge-success px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{manifest?.total_files || 0} Files Extracted</span>
              </span>
            ) : null}
          </div>

          {/* Compact Summary View after upload */}
          {hasZipUploaded && !forceExpandZip ? (
            <div className="qet-card-elevated p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-file-item">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-mono font-bold" style={{ color: 'var(--qet-accent)' }}>
                  {manifest?.total_files} files
                </span>
                <span style={{ color: 'var(--qet-text-muted)' }}>
                  ({(((manifest?.total_size_bytes || 0)) / 1024).toFixed(1)} KB uncompressed)
                </span>
                {typeof manifest?.excluded_file_count === 'number' && manifest.excluded_file_count > 0 && (
                  <span className="qet-badge-warning px-2 py-0.5 text-[10px] font-semibold">
                    {manifest.excluded_file_count} binary assets excluded
                  </span>
                )}
              </div>
              <button
                onClick={() => setForceExpandZip(true)}
                className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace Codebase ZIP</span>
              </button>
            </div>
          ) : (
            /* Expanded Dropzone */
            <label
              onDragOver={(e) => { e.preventDefault(); if (!uploadingZip) setIsDraggingZip(true); }}
              onDragLeave={() => setIsDraggingZip(false)}
              onDrop={handleZipDrop}
              className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[140px] p-6 text-center cursor-pointer group ${
                isDraggingZip ? 'ring-2 ring-cyan-500 bg-cyan-50/20' : ''
              }`}
            >
              <input
                type="file"
                accept=".zip"
                onChange={handleZipSelect}
                className="hidden"
                disabled={uploadingZip}
              />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--qet-surface-elevated)' }}
              >
                {uploadingZip ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--qet-accent)' }} />
                ) : (
                  <FileArchive className="w-5 h-5" style={{ color: 'var(--qet-accent)' }} />
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                {uploadingZip ? 'Extracting & Indexing Codebase...' : isDraggingZip ? 'Drop ZIP now' : 'Click to Browse or Drag & Drop Source ZIP'}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--qet-text-muted)' }}>
                Accepts React, TypeScript, Python, and HTML archives (.zip)
              </p>
            </label>
          )}

          {zipError && renderUploadError(zipError)}
        </div>

        {/* Step 3: AI Understanding Action */}
        {isIntakeReady && (
          <div className="qet-card-elevated p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-file-item border" style={{ borderColor: 'var(--qet-accent-border)', backgroundColor: 'var(--qet-accent-subtle)' }}>
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold flex items-center justify-center sm:justify-start gap-2" style={{ color: 'var(--qet-text-primary)' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Step 3 &middot; Application Architecture Understanding</span>
              </h4>
              <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>
                Sources are validated and indexed. Launch the AI Understanding agent to discover components, user flows, and requirement gaps.
              </p>
            </div>
            <button
              onClick={onProceedToUnderstanding}
              className="qet-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md whitespace-nowrap cursor-pointer"
            >
              <span>Start AI Understanding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

