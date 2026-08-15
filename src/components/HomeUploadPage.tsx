import React, { useState, useEffect } from 'react';
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
  Cpu, 
  Terminal, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Clock, 
  Eye,
  FileCheck2,
  FolderArchive,
  BarChart3
} from 'lucide-react';
import { AppState, AgentStatus } from '../types';
import { uploadDocuments, uploadCodebase, retryRun, createRun, ApiError } from '../services/apiClient';

interface HomeUploadPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
  onProceedToUnderstanding: () => void;
  onCreateNewRun: () => void;
  onInspectAgent?: (agentId: string) => void;
}

export const HomeUploadPage: React.FC<HomeUploadPageProps> = ({
  appState,
  onRefreshStatus,
  onProceedToUnderstanding,
  onCreateNewRun,
  onInspectAgent
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

  // Subagents stream with dynamic status
  const getSubagents = () => {
    let sub1Status: AgentStatus = hasDocsUploaded ? 'completed' : uploadingDocs ? 'running' : 'pending';
    let sub2Status: AgentStatus = hasZipUploaded ? 'completed' : uploadingZip ? 'running' : hasDocsUploaded ? 'pending' : 'pending';
    let sub3Status: AgentStatus = isUnderstandingReady ? 'completed' : isUnderstandingRunning ? 'running' : 'pending';
    let sub4Status: AgentStatus = isUnderstandingReady ? 'completed' : isUnderstandingRunning ? 'running' : 'pending';

    return [
      {
        id: 'sub_doc_parser',
        name: 'Requirement Parser',
        desc: '15-Point Checklist Evaluator',
        status: sub1Status,
        message: hasDocsUploaded ? `${manifest?.doc_files?.length || 1} spec document(s) indexed` : 'Awaiting document upload',
      },
      {
        id: 'sub_ast_extractor',
        name: 'Codebase AST Extractor',
        desc: 'Component & Selector Discovery',
        status: sub2Status,
        message: hasZipUploaded ? `${manifest?.total_files || 0} source files parsed` : 'Awaiting codebase ZIP archive',
      },
      {
        id: 'sub_flow_synthesizer',
        name: 'UI Journey Synthesizer',
        desc: 'State Flow & Routing Mapping',
        status: sub3Status,
        message: isUnderstandingReady ? 'UI tree & flows synthesized' : isUnderstandingRunning ? 'Scanning components & DOM...' : 'Awaiting AI kickoff',
      },
      {
        id: 'sub_gap_analyzer',
        name: 'Requirement Gap Analyzer',
        desc: 'Quality & Coverage Scorer',
        status: sub4Status,
        message: isUnderstandingReady ? 'Gap matrix & testability generated' : isUnderstandingRunning ? 'Evaluating checklist gaps...' : 'Awaiting AI kickoff',
      },
    ];
  };

  const subagents = getSubagents();
  const completedSubagentsCount = subagents.filter(s => s.status === 'completed').length;

  // Retry step and invalidate downstream state
  const handleRetryStep = async (targetAgentId: 'requirement_understanding' | 'document_intake' | 'application_understanding') => {
    if (!runId) return;
    setRetryingStep(targetAgentId);
    try {
      await retryRun(runId, targetAgentId);
      if (targetAgentId === 'requirement_understanding') {
        setDocFiles([]);
        setZipFile(null);
        setForceExpandDocs(true);
      } else if (targetAgentId === 'document_intake') {
        setZipFile(null);
        setForceExpandZip(true);
      }
      onRefreshStatus();
    } catch (err) {
      console.error('Failed to retry step:', err);
    } finally {
      setRetryingStep(null);
    }
  };

  // Upload Handlers
  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    setDocFiles(selected);
    await performDocUpload(selected);
  };

  const performDocUpload = async (files: File[]) => {
    let targetRunId = runId;
    if (!targetRunId) {
      try {
        const newRun = await createRun('CFA Digital Journey');
        targetRunId = newRun.run_id;
        onRefreshStatus();
      } catch {
        setDocError(new Error('Failed to create run session. Please ensure backend is running.'));
        return;
      }
    }
    setUploadingDocs(true);
    setDocError(null);
    setDocSuccess(null);
    try {
      const res = await uploadDocuments(targetRunId, files);
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
    let targetRunId = runId;
    if (!targetRunId) {
      try {
        const newRun = await createRun('CFA Digital Journey');
        targetRunId = newRun.run_id;
        onRefreshStatus();
      } catch {
        setZipError(new Error('Failed to create run session. Please ensure backend is running.'));
        return;
      }
    }
    setUploadingZip(true);
    setZipError(null);
    setZipSuccess(null);
    try {
      const res = await uploadCodebase(targetRunId, file);
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
              <div className="p-3.5 rounded-xl qet-card-elevated border border-emerald-500/20 flex items-center justify-between">
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
                <span className="qet-badge-success px-2.5 py-1 text-xs font-bold">
                  Indexed
                </span>
              </div>

              {/* Collapsed Metrics Grid */}
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

              {/* Expandable File List Accordion */}
              <div className="pt-1">
                <button
                  onClick={() => setShowDocDetails(!showDocDetails)}
                  className="w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg qet-btn-secondary cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showDocDetails ? 'Hide Document Details' : 'Expand Document Details'}</span>
                  </span>
                  {showDocDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showDocDetails && (
                  <div className="space-y-2 pt-2 animate-file-item">
                    {/* Filters */}
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                            <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-mono truncate">{df}</span>
                          </div>
                          <span className="qet-badge-success px-2 py-0.5 text-[10px] font-semibold shrink-0">
                            Included
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                accept=".md,.pdf,.txt,.docx,.doc"
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
                  <UploadCloud className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                {uploadingDocs ? 'Indexing Requirement Documents...' : isDraggingDocs ? 'Drop files now' : 'Click to Browse or Drag & Drop Documents'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--qet-text-muted)' }}>
                Supports Markdown, PDF, Text, and Word (.md, .pdf, .txt, .docx)
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
              <div className="p-3.5 rounded-xl qet-card-elevated border border-cyan-500/20 flex items-center justify-between">
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
                <span className="qet-badge-success px-2.5 py-1 text-xs font-bold">
                  Indexed
                </span>
              </div>

              {/* Collapsed Metrics Grid */}
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

              {/* Expandable File List Accordion */}
              <div className="pt-1">
                <button
                  onClick={() => setShowZipDetails(!showZipDetails)}
                  className="w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg qet-btn-secondary cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{showZipDetails ? 'Hide File Details' : 'Expand File Details'}</span>
                  </span>
                  {showZipDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showZipDetails && (
                  <div className="space-y-2 pt-2 animate-file-item">
                    {/* Filters */}
                    <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* ── 4. Stage 3 Hero Action: Application Understanding Agent ──── */}
      <div 
        className={`p-6 rounded-2xl transition-all duration-300 ${
          hasDocsUploaded && hasZipUploaded
            ? 'agent-hero-card animate-hero-enter qet-card'
            : 'qet-panel border'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shrink-0">
                <Bot className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                    3. Application Understanding Agent
                  </h3>
                  {hasDocsUploaded && hasZipUploaded && (
                    <span className="qet-badge-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Active Hero
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>
                  Deep AI synthesis discovering component DOM selectors, user flows, APIs, and 15-point requirement gaps.
                </p>
              </div>
            </div>

            {/* Live Processing Activity Text */}
            {isUnderstandingRunning && (
              <div className="mt-2 p-3 rounded-xl flex items-center gap-3 qet-badge-accent animate-pulse-glow text-xs">
                <Activity className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                <span className="font-mono font-semibold">
                  {liveActivities[activityIndex]}
                </span>
              </div>
            )}
          </div>

          {/* Action CTA Button */}
          {isIntakeReady && (
            <button
              onClick={onProceedToUnderstanding}
              className="qet-btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs font-bold shadow-lg whitespace-nowrap cursor-pointer self-stretch sm:self-auto justify-center rounded-xl"
            >
              <span>{isUnderstandingReady ? 'View AI Understanding Results' : 'Start AI Understanding'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
