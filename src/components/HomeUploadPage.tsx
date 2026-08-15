import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileCode,
  FolderArchive,
  Bot,
  Layers,
  FileCheck2
} from 'lucide-react';
import { AppState, AgentStatus } from '../types';
import { uploadDocuments, uploadCodebase, retryRun, ApiError } from '../services/apiClient';

interface HomeUploadPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
  onProceedToUnderstanding: () => void;
  onCreateNewRun: () => void;
  onInspectAgent?: (agentId: string) => void;
  onLogEvent?: (msg: string, level?: 'info' | 'warn' | 'error') => void;
  onFetchLogsNow?: () => void;
}

export const HomeUploadPage: React.FC<HomeUploadPageProps> = ({
  appState,
  onRefreshStatus,
  onProceedToUnderstanding,
  onCreateNewRun,
  onInspectAgent,
  onLogEvent,
  onFetchLogsNow,
}) => {
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [retryingStep, setRetryingStep] = useState<string | null>(null);

  const [docError, setDocError] = useState<Error | null>(null);
  const [zipError, setZipError] = useState<Error | null>(null);

  const [docSuccess, setDocSuccess] = useState<string | null>(null);
  const [zipSuccess, setZipSuccess] = useState<string | null>(null);

  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);

  const [forceExpandDocs, setForceExpandDocs] = useState(false);
  const [forceExpandZip, setForceExpandZip] = useState(false);

  const [showDocDetails, setShowDocDetails] = useState(false);
  const [showZipDetails, setShowZipDetails] = useState(false);

  const [docFilter, setDocFilter] = useState<'all' | 'included' | 'excluded' | 'reviewed'>('all');
  const [zipFilter, setZipFilter] = useState<'all' | 'included' | 'excluded' | 'reviewed'>('all');

  const [activityIndex, setActivityIndex] = useState(0);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';
  const progress = appState?.progress || 0;
  const manifest = appState?.intake_manifest;

  const hasDocsUploaded = Boolean(manifest?.doc_files && manifest.doc_files.length > 0);
  const hasZipUploaded = Boolean(manifest && manifest.total_files > 0);
  const isIntakeReady = hasDocsUploaded || hasZipUploaded;
  const isUnderstandingRunning = currentStatus === 'ai_understanding_running';
  const isUnderstandingReady = currentStatus === 'understanding_ready';

  const liveActivities = [
    'Parsing TypeScript & React component AST...',
    'Mapping user journeys and authentication gateways...',
    'Evaluating 15-point requirement validation checklist...',
    'Synthesizing application flows & requirement gap analysis...',
  ];

  useEffect(() => {
    if (isUnderstandingRunning) {
      const interval = setInterval(() => {
        setActivityIndex((prev) => (prev + 1) % liveActivities.length);
      }, 2500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isUnderstandingRunning]);

  // Handle Document Upload
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setDocFiles(selected);
      performDocUpload(selected);
    }
  };

  const performDocUpload = async (files: File[]) => {
    let targetRunId = runId;
    if (!targetRunId) {
      try {
        const { createRun } = await import('../services/apiClient');
        const res = await createRun('CFA Digital Journey');
        targetRunId = res.run_id;
        onCreateNewRun();
      } catch {
        onLogEvent?.('Failed to create run session. Please ensure backend is running.', 'error');
        setDocError(new Error('Failed to create run session. Please ensure backend is running.'));
        return;
      }
    }
    setUploadingDocs(true);
    setDocError(null);
    setDocSuccess(null);
    onLogEvent?.(`Uploading ${files.length} requirement document(s)...`, 'info');
    try {
      const res = await uploadDocuments(targetRunId, files);
      setDocSuccess(`Uploaded ${res.uploaded_count || files.length} document(s) successfully.`);
      onLogEvent?.(`[STATUS] Intake ready: ${res.uploaded_count || files.length} spec document(s) indexed.`, 'info');
      setForceExpandDocs(false);
      onRefreshStatus();
      onFetchLogsNow?.();
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onLogEvent?.(`Document upload failed: ${errorMsg}`, 'error');
      setDocError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDocDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingDocs(false);
    if (uploadingDocs || !e.dataTransfer.files.length) return;
    const dropped = Array.from(e.dataTransfer.files);
    setDocFiles(dropped);
    await performDocUpload(dropped);
  };

  // Handle Codebase ZIP Upload
  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setZipFile(selected);
      performZipUpload(selected);
    }
  };

  const performZipUpload = async (file: File) => {
    let targetRunId = runId;
    if (!targetRunId) {
      try {
        const { createRun } = await import('../services/apiClient');
        const res = await createRun('CFA Digital Journey');
        targetRunId = res.run_id;
        onCreateNewRun();
      } catch {
        onLogEvent?.('Failed to create run session. Please ensure backend is running.', 'error');
        setZipError(new Error('Failed to create run session. Please ensure backend is running.'));
        return;
      }
    }
    setUploadingZip(true);
    setZipError(null);
    setZipSuccess(null);
    const sizeKb = (file.size / 1024.0).toFixed(1);
    onLogEvent?.(`Uploading codebase archive '${file.name}' (${sizeKb} KB)...`, 'info');
    try {
      const res = await uploadCodebase(targetRunId, file);
      setZipSuccess(`Archive unpacked: ${res.intake_manifest.total_files} files indexed.`);
      onLogEvent?.(`[STATUS] Codebase unpacked: ${res.intake_manifest.total_files} source files indexed into workspace.`, 'info');
      setForceExpandZip(false);
      onRefreshStatus();
      onFetchLogsNow?.();
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onLogEvent?.(`Codebase upload failed: ${errorMsg}`, 'error');
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

  // Step Retry Logic
  const handleRetryStep = async (stepKey: string) => {
    if (!runId || retryingStep) return;
    setRetryingStep(stepKey);
    onLogEvent?.(`[RETRY] Requesting reset & retry of step '${stepKey}'...`, 'info');
    try {
      await retryRun(runId, stepKey);
      onLogEvent?.(`[RETRY] Step '${stepKey}' cleared and ready for re-execution.`, 'info');
      if (stepKey === 'requirement_understanding') {
        setForceExpandDocs(true);
      } else if (stepKey === 'document_intake') {
        setForceExpandZip(true);
      }
      onRefreshStatus();
      onFetchLogsNow?.();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      onLogEvent?.(`Retry failed: ${msg}`, 'error');
    } finally {
      setRetryingStep(null);
    }
  };

  const renderUploadError = (err: Error) => {
    const apiErr = err instanceof ApiError ? err : null;
    const isFetchFailure = err.message === 'Failed to fetch' || err.message.includes('fetch');
    const displayMessage = isFetchFailure
      ? 'Backend connection failed (Failed to fetch). Please ensure the backend server is running on http://127.0.0.1:8080.'
      : err.message;

    return (
      <div className="qet-badge-danger p-3 text-xs space-y-1.5 animate-file-item rounded-lg mt-2">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{displayMessage}</span>
            {apiErr?.error_code && (
              <div className="font-mono text-[10px] mt-0.5 opacity-85">error_code: {apiErr.error_code}</div>
            )}
            {isFetchFailure && (
              <div className="text-[11px] mt-1 opacity-90">
                Tip: Run <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[10px]">restart_fastapi_app.bat</code> in the terminal to start the backend server.
              </div>
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
      {/* Live Processing Activity Banner */}
      {isUnderstandingRunning && (
        <div className="p-4 rounded-xl qet-card-elevated border border-blue-500/30 flex items-center gap-3 bg-blue-950/20 animate-fade-in">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          <div>
            <div className="text-xs font-bold text-blue-300">AI Understanding in Progress</div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              {liveActivities[activityIndex]}
            </div>
          </div>
        </div>
      )}

      {/* ── Dual Upload Lanes: Left (Documents) & Right (Codebase ZIP) ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Lane: 1. Requirement Understanding Agent (Documents) */}
        <div 
          className={`p-5 rounded-2xl transition-all duration-300 ${
            !hasDocsUploaded
              ? 'agent-hero-card animate-hero-enter qet-card'
              : 'qet-panel border'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shrink-0">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                    1. Requirement Understanding Agent
                  </h3>
                  {!hasDocsUploaded && (
                    <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Active Hero
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                  Requirement Specifications (.md, .pdf, .docx, .txt)
                </p>
              </div>
            </div>

            {/* Inspect and Re-upload buttons when uploaded */}
            {hasDocsUploaded && !forceExpandDocs && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onInspectAgent?.('requirement_understanding')}
                  title="Inspect Agent Details & Manifest in Drawer"
                  className="qet-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold cursor-pointer rounded-md text-blue-400 hover:text-blue-300"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect</span>
                </button>
                <button
                  onClick={() => setForceExpandDocs(true)}
                  title="Replace uploaded documents"
                  className="qet-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold cursor-pointer rounded-md"
                >
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  <span>Re-upload</span>
                </button>
                <button
                  onClick={() => handleRetryStep('requirement_understanding')}
                  disabled={retryingStep !== null}
                  title="Retry step and clear downstream data"
                  className="qet-btn-secondary p-1 text-xs cursor-pointer rounded-md"
                >
                  <RotateCcw className="w-3 h-3 text-amber-500" />
                </button>
              </div>
            )}
          </div>

          {/* Automatic Rich Live Metrics Card when uploaded */}
          {hasDocsUploaded && !forceExpandDocs ? (
            <div className="space-y-3 animate-file-item">
              {/* Metrics Header Summary */}
              <div className="p-3 rounded-xl qet-card-elevated border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                      {manifest?.doc_files?.length || 1} Requirement Document(s) Indexed
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>
                      Populated validation checklist baseline
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="qet-badge-success px-2.5 py-0.5 text-xs font-bold">
                    Indexed
                  </span>
                  <button
                    onClick={() => setShowDocDetails(!showDocDetails)}
                    className="p-1 px-2 text-[11px] font-medium rounded-md qet-btn-secondary text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title={showDocDetails ? 'Collapse Details' : 'Expand Details'}
                  >
                    <span>{showDocDetails ? 'Collapse File Details' : 'Expand File Details'}</span>
                    {showDocDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable File List Details */}
              {showDocDetails && (
                <div className="space-y-2 pt-1 animate-file-item">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                      <div className="font-bold text-sm" style={{ color: 'var(--qet-text-primary)' }}>
                        {manifest?.doc_files?.length || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-emerald-500">Included</div>
                      <div className="font-bold text-sm text-emerald-500">
                        {manifest?.doc_files?.length || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Excluded</div>
                      <div className="font-bold text-sm text-slate-400">0</div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(['all', 'included', 'excluded', 'reviewed'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setDocFilter(f)}
                        className={`upload-filter-btn ${docFilter === f ? 'active' : ''}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Files List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {manifest?.doc_files?.map((df, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-md qet-card-elevated text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-mono truncate">{df}</span>
                        </div>
                        <span className="qet-badge-success text-[10px] font-semibold px-2 py-0.5 rounded">
                          Indexed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone */
            <label
              onDragOver={(e) => { e.preventDefault(); if (!uploadingDocs) setIsDraggingDocs(true); }}
              onDragLeave={() => setIsDraggingDocs(false)}
              onDrop={handleDocDrop}
              className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[140px] p-5 text-center cursor-pointer group ${
                isDraggingDocs ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              <input
                type="file"
                multiple
                accept=".md,.pdf,.docx,.txt"
                onChange={handleDocSelect}
                className="hidden"
                disabled={uploadingDocs}
              />
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--qet-surface-elevated)' }}
              >
                {uploadingDocs ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                {uploadingDocs ? 'Ingesting Requirements...' : isDraggingDocs ? 'Drop files now' : 'Click to Browse or Drag & Drop Documents'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--qet-text-muted)' }}>
                Accepts Markdown (.md), PDF (.pdf), Word (.docx), and Text (.txt)
              </p>
            </label>
          )}

          {docError && renderUploadError(docError)}
        </div>

        {/* Right Lane: 2. Document Intake Agent (Codebase ZIP) */}
        <div 
          className={`p-5 rounded-2xl transition-all duration-300 ${
            hasDocsUploaded && !hasZipUploaded
              ? 'agent-hero-card animate-hero-enter qet-card'
              : 'qet-panel border'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                <FileArchive className="w-4 h-4 text-cyan-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                    2. Document Intake Agent &middot; Codebase Intake
                  </h3>
                  {hasDocsUploaded && !hasZipUploaded && (
                    <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Active Hero
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                  Target Application Codebase Archive (.zip)
                </p>
              </div>
            </div>

            {/* Inspect and Re-upload buttons when uploaded */}
            {hasZipUploaded && !forceExpandZip && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onInspectAgent?.('document_intake')}
                  title="Inspect Codebase AST & Files in Drawer"
                  className="qet-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold cursor-pointer rounded-md text-cyan-400 hover:text-cyan-300"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect</span>
                </button>
                <button
                  onClick={() => setForceExpandZip(true)}
                  title="Replace uploaded codebase ZIP"
                  className="qet-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold cursor-pointer rounded-md"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Re-upload</span>
                </button>
                <button
                  onClick={() => handleRetryStep('document_intake')}
                  disabled={retryingStep !== null}
                  title="Retry step and clear downstream data"
                  className="qet-btn-secondary p-1 text-xs cursor-pointer rounded-md"
                >
                  <RotateCcw className="w-3 h-3 text-amber-500" />
                </button>
              </div>
            )}
          </div>

          {/* Automatic Rich Live Metrics Card when uploaded */}
          {hasZipUploaded && !forceExpandZip ? (
            <div className="space-y-3 animate-file-item">
              {/* Metrics Header Summary */}
              <div className="p-3 rounded-xl qet-card-elevated border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderArchive className="w-5 h-5 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                      {manifest?.total_files} Source Files Extracted &amp; Indexed
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>
                      {(((manifest?.total_size_bytes || 0)) / 1024).toFixed(1)} KB uncompressed &middot; {manifest?.zip_filename}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="qet-badge-success px-2.5 py-0.5 text-xs font-bold">
                    Indexed
                  </span>
                  <button
                    onClick={() => setShowZipDetails(!showZipDetails)}
                    className="p-1 px-2 text-[11px] font-medium rounded-md qet-btn-secondary text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    title={showZipDetails ? 'Collapse Details' : 'Expand Details'}
                  >
                    <span>{showZipDetails ? 'Collapse File Details' : 'Expand File Details'}</span>
                    {showZipDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable File List Accordion */}
              {showZipDetails && (
                <div className="space-y-2 pt-1 animate-file-item">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                      <div className="font-bold text-sm" style={{ color: 'var(--qet-text-primary)' }}>
                        {manifest?.total_files || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-emerald-500">Included</div>
                      <div className="font-bold text-sm text-emerald-500">
                        {manifest?.total_files || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-amber-500">Excluded</div>
                      <div className="font-bold text-sm text-amber-500">
                        {manifest?.excluded_file_count || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg qet-card-elevated">
                      <div className="text-[10px] uppercase font-bold text-cyan-500">Reviewed</div>
                      <div className="font-bold text-sm text-cyan-500">
                        {manifest?.total_files || 0}
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(['all', 'included', 'excluded', 'reviewed'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setZipFilter(f)}
                        className={`upload-filter-btn ${zipFilter === f ? 'active' : ''}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* File rows */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
                    {manifest?.files && manifest.files.length > 0 ? (
                      manifest.files
                        .filter(file => {
                          if (zipFilter === 'excluded') return file.is_binary;
                          if (zipFilter === 'included') return !file.is_binary;
                          return true;
                        })
                        .map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-md qet-card-elevated">
                            <div className="flex items-center gap-2 truncate">
                              <FileCode className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span className="font-mono truncate">{file.rel_path}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold shrink-0 rounded ${
                              file.is_binary ? 'qet-badge-warning' : 'qet-badge-success'
                            }`}>
                              {file.is_binary ? 'Excluded' : 'Included'}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        {manifest?.total_files} source files in {manifest?.zip_filename}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone */
            <label
              onDragOver={(e) => { e.preventDefault(); if (!uploadingZip) setIsDraggingZip(true); }}
              onDragLeave={() => setIsDraggingZip(false)}
              onDrop={handleZipDrop}
              className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[140px] p-5 text-center cursor-pointer group ${
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
                className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--qet-surface-elevated)' }}
              >
                {uploadingZip ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                ) : (
                  <FileArchive className="w-5 h-5 text-cyan-500" />
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                {uploadingZip ? 'Extracting & Indexing Codebase...' : isDraggingZip ? 'Drop ZIP now' : 'Click to Browse or Drag & Drop Source ZIP'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--qet-text-muted)' }}>
                Accepts React, TypeScript, Python, and HTML archives (.zip)
              </p>
            </label>
          )}

          {zipError && renderUploadError(zipError)}
        </div>
      </div>
    </div>
  );
};
