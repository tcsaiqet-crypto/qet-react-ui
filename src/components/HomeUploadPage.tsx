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
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  Eye 
} from 'lucide-react';
import { AppState, UploadLaneSummary, UploadLaneItem, AgentStatus } from '../types';
import { uploadDocuments, uploadCodebase, retryRun, ApiError } from '../services/apiClient';

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

  // Active Hero Stage determination
  let activeStageIndex = 0;
  let upcomingAgentName = 'Document Intake Agent';
  if (!hasDocsUploaded) {
    activeStageIndex = 0; // Stage 1: Requirement Understanding Agent
    upcomingAgentName = 'Document Intake Agent (Codebase ZIP)';
  } else if (!hasZipUploaded) {
    activeStageIndex = 1; // Stage 2: Document Intake Agent
    upcomingAgentName = 'Application Understanding Agent (AI Synthesis)';
  } else {
    activeStageIndex = 2; // Stage 3: Application Understanding Agent
    upcomingAgentName = isUnderstandingReady ? 'Quality Report & Test Suite Generator' : 'Application Understanding Ready';
  }

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

  // Subagents list with deterministic status based on current pipeline progress
  const getSubagents = () => {
    let sub1Status: AgentStatus = hasDocsUploaded ? 'completed' : uploadingDocs ? 'running' : 'pending';
    let sub2Status: AgentStatus = hasZipUploaded ? 'completed' : uploadingZip ? 'running' : hasDocsUploaded ? 'pending' : 'pending';
    let sub3Status: AgentStatus = isUnderstandingReady ? 'completed' : isUnderstandingRunning ? 'running' : 'pending';
    let sub4Status: AgentStatus = isUnderstandingReady ? 'completed' : isUnderstandingRunning ? 'running' : 'pending';

    return [
      {
        id: 'sub_doc_parser',
        name: 'Requirement Parser & 15-Point Checklist Evaluator',
        agent: 'Requirement Understanding Agent',
        status: sub1Status,
        message: hasDocsUploaded ? `${manifest?.doc_files?.length || 1} spec document(s) validated against checklist` : 'Awaiting requirement document upload',
      },
      {
        id: 'sub_ast_extractor',
        name: 'Codebase AST & Selector Extractor',
        agent: 'Document Intake Agent',
        status: sub2Status,
        message: hasZipUploaded ? `${manifest?.total_files || 0} source files extracted & indexed` : 'Awaiting target codebase ZIP archive',
      },
      {
        id: 'sub_flow_synthesizer',
        name: 'UI Journey & State Flow Synthesizer',
        agent: 'Application Understanding Agent',
        status: sub3Status,
        message: isUnderstandingReady ? 'UI components & routing tree synthesized' : isUnderstandingRunning ? 'Scanning components & DOM selectors...' : 'Awaiting AI stage kickoff',
      },
      {
        id: 'sub_gap_analyzer',
        name: 'Requirement Gap Discovery & Quality Calculator',
        agent: 'Application Understanding Agent',
        status: sub4Status,
        message: isUnderstandingReady ? 'Requirements mapped and gap matrix generated' : isUnderstandingRunning ? 'Evaluating requirement coverage & testability...' : 'Awaiting AI stage kickoff',
      },
    ];
  };

  const subagents = getSubagents();

  // Retry previous agent and purge downstream outputs
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

  const renderUploadError = (err: Error) => {
    const apiErr = err instanceof ApiError ? err : null;
    return (
      <div className="qet-badge-danger p-3 text-xs space-y-1.5 animate-file-item rounded-lg">
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
              <span>Spec-Kit 011 Agent Choreography</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--qet-text-primary)' }}>
              Execution Workspace &amp; Agent Orchestration
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg qet-card-elevated">
              <Bot className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
              <span style={{ color: 'var(--qet-text-muted)' }}>Active Stage:</span>
              <span className="font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                {activeStageIndex === 0 ? '1. Requirement Understanding Agent' : activeStageIndex === 1 ? '2. Document Intake Agent' : '3. Application Understanding Agent'}
              </span>
            </div>
          </div>

          {/* Controls */}
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

      {/* ── 2. Unified Curved Orchestration Surface (G1) ───────────── */}
      <div className="qet-orchestration-container p-6 space-y-6">
        {/* Top Upcoming Agent Preview (G3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl qet-card-elevated border border-dashed border-blue-500/30">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-blue-500 mr-2">Upcoming Agent:</span>
              <span className="font-semibold" style={{ color: 'var(--qet-text-primary)' }}>{upcomingAgentName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="qet-badge-neutral px-2.5 py-1 text-[11px] font-mono">
              Generation: {appState?.reset_generation || 1}
            </span>
            <span className="qet-badge-accent px-2.5 py-1 text-xs font-mono font-bold">
              {progress.toFixed(0)}% Progress
            </span>
          </div>
        </div>

        {/* 2-Column Choreography Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Main Agent Progression Ladder & Hero (G2) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--qet-border)' }}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Main Agent Lifecycle Ladder
                </h3>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>
                Step {activeStageIndex + 1} of 3 Active
              </span>
            </div>

            {/* ── Stage 1: Requirement Understanding Agent ── */}
            <div 
              className={`p-5 rounded-xl transition-all duration-300 ${
                activeStageIndex === 0 
                  ? 'agent-hero-card animate-hero-enter qet-card' 
                  : 'agent-compact-card qet-card'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
                  >
                    <FileText className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                        1. Requirement Understanding Agent
                      </h4>
                      {activeStageIndex === 0 && (
                        <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          Active Hero
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                      Ingests PRD / specifications (.md, .pdf, .docx, .txt) to establish requirement baseline
                    </p>
                  </div>
                </div>

                {hasDocsUploaded && !forceExpandDocs ? (
                  <div className="flex items-center gap-2">
                    <span className="qet-badge-success px-2 py-1 text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{manifest?.doc_files?.length || 0} Docs Indexed</span>
                    </span>
                    <button
                      onClick={() => handleRetryStep('requirement_understanding')}
                      disabled={retryingStep !== null}
                      title="Retry this step and clear downstream progress"
                      className="qet-btn-secondary p-1.5 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px]">Retry Step</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Compact summary vs Dropzone */}
              {hasDocsUploaded && !forceExpandDocs ? (
                <div className="qet-card-elevated p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-file-item">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Replace / Add Docs</span>
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); if (!uploadingDocs) setIsDraggingDocs(true); }}
                  onDragLeave={() => setIsDraggingDocs(false)}
                  onDrop={handleDocDrop}
                  className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[120px] p-5 text-center cursor-pointer group ${
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
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105"
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

            {/* ── Stage 2: Document Intake Agent (Codebase ZIP) ── */}
            <div 
              className={`p-5 rounded-xl transition-all duration-300 ${
                activeStageIndex === 1 
                  ? 'agent-hero-card animate-hero-enter qet-card' 
                  : 'agent-compact-card qet-card'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
                  >
                    <FileArchive className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                        2. Document Intake Agent &middot; Codebase Intake
                      </h4>
                      {activeStageIndex === 1 && (
                        <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          Active Hero
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                      Extracts target application (.zip), indexes components, and filters assets
                    </p>
                  </div>
                </div>

                {hasZipUploaded && !forceExpandZip ? (
                  <div className="flex items-center gap-2">
                    <span className="qet-badge-success px-2 py-1 text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{manifest?.total_files || 0} Files Extracted</span>
                    </span>
                    <button
                      onClick={() => handleRetryStep('document_intake')}
                      disabled={retryingStep !== null}
                      title="Retry this step and clear downstream progress"
                      className="qet-btn-secondary p-1.5 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px]">Retry Step</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Compact summary vs Dropzone */}
              {hasZipUploaded && !forceExpandZip ? (
                <div className="qet-card-elevated p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-file-item">
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
                    className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Replace Codebase ZIP</span>
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); if (!uploadingZip) setIsDraggingDocs(false); setIsDraggingZip(true); }}
                  onDragLeave={() => setIsDraggingZip(false)}
                  onDrop={handleZipDrop}
                  className={`qet-dropzone relative flex flex-col items-center justify-center w-full min-h-[120px] p-5 text-center cursor-pointer group ${
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
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105"
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

            {/* ── Stage 3: Application Understanding Agent ── */}
            <div 
              className={`p-5 rounded-xl transition-all duration-300 ${
                activeStageIndex === 2 
                  ? 'agent-hero-card animate-hero-enter qet-card' 
                  : 'agent-compact-card qet-card'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
                    >
                      <Bot className="w-4 h-4" style={{ color: 'var(--qet-accent)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                          3. Application Understanding Agent
                        </h4>
                        {activeStageIndex === 2 && (
                          <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Active Hero
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--qet-text-secondary)' }}>
                        AI analysis discovering UI components, user journeys, testability, and requirement gaps.
                      </p>
                    </div>
                  </div>

                  {/* Live Processing Activity Text */}
                  {isUnderstandingRunning && (
                    <div className="mt-2 p-2.5 rounded-lg flex items-center gap-2.5 qet-badge-accent animate-pulse-glow text-xs">
                      <Activity className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="font-mono font-semibold">
                        {liveActivities[activityIndex]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Launch / View Action Button */}
                {isIntakeReady && (
                  <button
                    onClick={onProceedToUnderstanding}
                    className="qet-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md whitespace-nowrap cursor-pointer self-stretch sm:self-auto justify-center"
                  >
                    <span>{isUnderstandingReady ? 'View AI Understanding' : 'Start AI Understanding'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Subagent Stream & Live Activity (G4) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--qet-border)' }}>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Subagent Stream &amp; Live Status
                </h3>
              </div>
              <span className="qet-badge-accent px-2 py-0.5 text-[10px] font-mono">
                {subagents.filter(s => s.status === 'completed').length} / {subagents.length} Done
              </span>
            </div>

            {/* Subagent Sequential Items */}
            <div className="subagent-stream">
              {subagents.map((sub, i) => (
                <div 
                  key={sub.id} 
                  className={`subagent-item ${sub.status === 'running' ? 'running' : sub.status === 'completed' ? 'completed' : ''}`}
                >
                  <div className="flex items-start gap-2.5 flex-1 pr-2">
                    <div className="mt-0.5">
                      {sub.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : sub.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 opacity-60" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs leading-tight" style={{ color: 'var(--qet-text-primary)' }}>
                        {sub.name}
                      </div>
                      <div className="text-[11px] leading-tight" style={{ color: 'var(--qet-text-muted)' }}>
                        {sub.message}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    sub.status === 'completed' 
                      ? 'qet-badge-success' 
                      : sub.status === 'running' 
                      ? 'qet-badge-accent animate-pulse' 
                      : 'qet-badge-neutral'
                  }`}>
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Contextual Narrative Card */}
            <div className="qet-card-elevated p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>Orchestration Narrative</span>
              </div>
              <p style={{ color: 'var(--qet-text-muted)' }}>
                {activeStageIndex === 0 
                  ? 'Stage 1 active: Provide specification files to populate the requirement validation baseline.'
                  : activeStageIndex === 1 
                  ? 'Stage 2 active: Provide codebase ZIP to initiate component AST extraction and route mapping.'
                  : isUnderstandingRunning 
                  ? 'Stage 3 executing: AI Understanding synthesizing flows, controls, APIs, and requirement gaps.'
                  : 'Analysis ready. Navigate to Understanding to inspect discovery artifacts and quality metrics.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Dual Upload Summary & Filtering Lanes (G5) ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lane 1: Requirement Documents Summary */}
        <div className="qet-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                Requirement Documents Lane
              </h4>
            </div>
            <span className="qet-badge-neutral px-2 py-0.5 text-xs font-mono">
              {manifest?.doc_files?.length || 0} files
            </span>
          </div>

          {/* Collapsed Stats Summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg qet-card-elevated">
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--qet-text-muted)' }}>Total</div>
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

          {/* Toggle Expand Details */}
          {hasDocsUploaded && (
            <div className="space-y-3 pt-1">
              <button
                onClick={() => setShowDocDetails(!showDocDetails)}
                className="w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg qet-btn-secondary cursor-pointer"
              >
                <span>{showDocDetails ? 'Hide Document List' : 'Expand Document List'}</span>
                {showDocDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDocDetails && (
                <div className="space-y-2.5 animate-file-item">
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

                  {/* Document Items */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
          )}
        </div>

        {/* Lane 2: Target Codebase Summary */}
        <div className="qet-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-cyan-500" />
              <h4 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                Target Codebase ZIP Lane
              </h4>
            </div>
            <span className="qet-badge-neutral px-2 py-0.5 text-xs font-mono">
              {manifest?.total_files || 0} files
            </span>
          </div>

          {/* Collapsed Stats Summary */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg qet-card-elevated">
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--qet-text-muted)' }}>Total</div>
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

          {/* Toggle Expand Details */}
          {hasZipUploaded && (
            <div className="space-y-3 pt-1">
              <button
                onClick={() => setShowZipDetails(!showZipDetails)}
                className="w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg qet-btn-secondary cursor-pointer"
              >
                <span>{showZipDetails ? 'Hide File List' : 'Expand File List'}</span>
                {showZipDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showZipDetails && (
                <div className="space-y-2.5 animate-file-item">
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

                  {/* File items */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
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
                        {manifest?.total_files} indexed source files in archive ({manifest?.zip_filename})
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
