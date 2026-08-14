import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  RotateCcw,
  Sparkles,
  Layers,
  Code
} from 'lucide-react';
import { AppState } from '../types';
import { uploadDocuments, uploadCodebase } from '../services/apiClient';

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

  const [docError, setDocError] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  const [docSuccess, setDocSuccess] = useState<string | null>(null);
  const [zipSuccess, setZipSuccess] = useState<string | null>(null);

  const runId = appState?.run_id || '';
  const currentStatus = appState?.status || 'idle';
  const progress = appState?.progress || 0;
  const manifest = appState?.intake_manifest;

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
    try:
      const res = await uploadDocuments(runId, files);
      setDocSuccess(`Successfully uploaded ${res.uploaded_count} requirement document(s).`);
      onRefreshStatus();
    } catch (err: any) {
      setDocError(err.message || 'Failed to upload document files.');
    } finally {
      setUploadingDocs(false);
    }
  };

  // Handle ZIP drop or select
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = e.target.files[0];
    if (!selected.name.endsWith('.zip')) {
      setZipError('Invalid file format. Please upload a .zip archive.');
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
      onRefreshStatus();
    } catch (err: any) {
      setZipError(err.message || 'Failed to upload codebase ZIP.');
    } finally {
      setUploadingZip(false);
    }
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

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>F01 Home Upload Experience</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
            Autonomous Quality & Test Execution Platform
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Create an execution run, upload business requirement specifications and codebase ZIP archives to trigger AI-driven application understanding, test case generation, and automation synthesis.
          </p>
        </div>

        {/* Run Controls Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Current Run ID:</span>
            <code className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
              {runId || 'Initializing...'}
            </code>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCreateNewRun}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create Fresh Run</span>
            </button>
            <button
              onClick={onRefreshStatus}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-1.5 rounded-lg border border-cyan-800/60 transition-colors"
            >
              <Loader2 className={`w-3.5 h-3.5 ${currentStatus.includes('running') ? 'animate-spin' : ''}`} />
              <span>Poll Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Requirement Documents */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">1. Requirement Specifications</h3>
                  <p className="text-xs text-slate-400">Upload .md, .pdf, .txt, or .docx docs</p>
                </div>
              </div>
              {docSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>

            {/* Dropzone area */}
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition-all p-4 text-center group">
              <input
                type="file"
                multiple
                accept=".md,.pdf,.txt,.docx"
                onChange={handleDocSelect}
                className="hidden"
                disabled={uploadingDocs}
              />
              <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                {uploadingDocs ? 'Uploading documents...' : 'Click or Drag & Drop Requirement Docs'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports Markdown, PDF, Text, and Word</p>
            </label>

            {/* Selected File Feedback */}
            {docSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{docSuccess}</span>
              </div>
            )}

            {docError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{docError}</span>
              </div>
            )}

            {/* Document Inventory count */}
            {manifest?.doc_files && manifest.doc_files.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uploaded Documents ({manifest.doc_files.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {manifest.doc_files.map((df, i) => (
                    <span key={i} className="text-xs bg-slate-950 text-slate-300 px-2 py-1 rounded border border-slate-800 font-mono">
                      {df}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Codebase ZIP Upload */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">2. Target Application Codebase</h3>
                  <p className="text-xs text-slate-400">Upload source code archive (.zip)</p>
                </div>
              </div>
              {zipSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>

            {/* Dropzone area */}
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700/80 hover:border-cyan-500/80 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition-all p-4 text-center group">
              <input
                type="file"
                accept=".zip"
                onChange={handleZipSelect}
                className="hidden"
                disabled={uploadingZip}
              />
              <FileArchive className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                {uploadingZip ? 'Extracting & Indexing ZIP...' : 'Click or Drag & Drop Source Code ZIP'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Accepts React, TypeScript, Python, HTML source archives</p>
            </label>

            {/* Selected File Feedback */}
            {zipSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{zipSuccess}</span>
              </div>
            )}

            {zipError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{zipError}</span>
              </div>
            )}

            {/* Codebase Manifest Details */}
            {manifest && manifest.total_files > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Extracted Files Count:</span>
                  <span className="font-mono text-cyan-300 font-bold">{manifest.total_files} files</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Code Size:</span>
                  <span className="font-mono text-slate-300">{(manifest.total_size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Backend Lifecycle Observability Timeline */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Run Lifecycle Status Timeline</h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Stage Progress:</span>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {stages.map((st, idx) => {
            const isCompleted = progress >= (idx + 1) * 16.6;
            const isCurrent = currentStatus === st.key;

            return (
              <div 
                key={st.key}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isCurrent 
                    ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : isCompleted
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-slate-950/50 border-slate-900 text-slate-600'
                }`}
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-1 opacity-70">Stage 0{idx+1}</div>
                <div className="text-xs font-semibold leading-tight">{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button to proceed to Understanding */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onProceedToUnderstanding}
          disabled={!isIntakeReady}
          className={`
            inline-flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg
            ${isIntakeReady 
              ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-cyan-500/25 cursor-pointer hover:scale-[1.02]' 
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
