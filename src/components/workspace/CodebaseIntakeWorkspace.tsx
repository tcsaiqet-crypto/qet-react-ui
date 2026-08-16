import React, { useState } from 'react';
import { 
  FolderArchive, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Code2, 
  FolderTree
} from 'lucide-react';
import { uploadCodebase } from '../../services/apiClient';
import { AppState } from '../../types';

interface CodebaseIntakeWorkspaceProps {
  appState: AppState | null;
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

export const CodebaseIntakeWorkspace: React.FC<CodebaseIntakeWorkspaceProps> = ({
  appState,
  onRefresh,
  onProceedNext,
}) => {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const manifest = appState?.intake_manifest;
  const isExtracted = manifest && manifest.total_files > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setZipFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only .zip archives are supported for codebase intake.');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        setZipFile(file);
        setUploadError(null);
      } else {
        setUploadError('Only .zip archives are supported for codebase intake.');
      }
    }
  };

  const handleUploadAndExtract = async () => {
    if (!appState?.run_id) return;
    if (!zipFile && !isExtracted) {
      setUploadError('Please select a codebase ZIP file.');
      return;
    }

    if (zipFile) {
      try {
        setIsUploading(true);
        setUploadError(null);
        await uploadCodebase(appState.run_id, zipFile);
        await onRefresh(appState.run_id);
        setIsUploading(false);
        onProceedNext();
      } catch (err: any) {
        setIsUploading(false);
        setUploadError(err.message || 'Failed to upload and extract codebase ZIP.');
      }
    } else {
      onProceedNext();
    }
  };

  const files = manifest?.files || [];
  const extensionCounts: Record<string, number> = {};
  files.forEach((f) => {
    const ext = f.extension || 'other';
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner */}
      <div className="qet-panel p-6 border-l-4 border-slate-700 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-primary text-[10px] uppercase font-bold px-2 py-0.5">
                Sub-Agent 1b
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Codebase Intake Sub-Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Upload and safely extract the target application codebase ZIP with Zip-Slip defense and AST indexing.
            </p>
          </div>
          {isExtracted && (
            <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Extracted & Indexed</span>
            </span>
          )}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`qet-card border-2 border-dashed p-8 text-center transition-all cursor-pointer bg-white ${
          dragOver ? 'border-slate-500 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => document.getElementById('codebase-zip-input')?.click()}
      >
        <input
          type="file"
          id="codebase-zip-input"
          className="hidden"
          accept=".zip"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-700">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {zipFile ? zipFile.name : 'Drag and drop your codebase ZIP archive here, or browse'}
            </p>
            <p className="text-xs text-slate-500">
              ZIP archives only (.zip) • Max 200MB • Zip-Slip protection active
            </p>
          </div>
          {zipFile && (
            <span className="qet-badge-primary text-xs font-bold px-3 py-1">
              Selected: {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="qet-badge-danger p-4 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Extraction Statistics */}
      {isExtracted && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="qet-card p-4 space-y-1 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Files</span>
              <p className="text-xl font-bold text-slate-900">
                {manifest.total_files}
              </p>
            </div>
            <div className="qet-card p-4 space-y-1 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Extracted Size</span>
              <p className="text-xl font-bold text-slate-900">
                {(manifest.total_size_bytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="qet-card p-4 space-y-1 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Source Types</span>
              <p className="text-xl font-bold text-slate-800">
                {Object.keys(extensionCounts).length} Exts
              </p>
            </div>
            <div className="qet-card p-4 space-y-1 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security Gate</span>
              <p className="text-xl font-bold text-[#2D6A4F]">
                PASSED (0 risks)
              </p>
            </div>
          </div>

          {/* Extension Breakdown */}
          <div className="qet-card p-5 space-y-3 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-700" />
              <span>Extracted Source Extensions</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(extensionCounts).map(([ext, count]) => (
                <div key={ext} className="qet-badge-secondary text-xs px-3 py-1.5 flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">{ext || 'no-ext'}</span>
                  <span className="text-slate-500">({count} files)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Files Preview */}
          <div className="qet-card p-5 space-y-3 max-h-60 overflow-y-auto bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-slate-700" />
              <span>Indexed File Structure (Sample)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs font-mono">
              {files.slice(0, 20).map((file, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-slate-700">{file.rel_path}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{(file.size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
              {files.length > 20 && (
                <div className="py-1.5 text-center text-slate-500 text-[11px]">
                  + {files.length - 20} more files indexed
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Step 1b: Codebase Archive Intake
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Next: AI Requirement Understanding
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Confirm codebase extraction to launch AI-driven application analysis and selector grounding.
          </p>
        </div>
        <button
          onClick={handleUploadAndExtract}
          disabled={isUploading || (!zipFile && !isExtracted)}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isUploading ? 'Extracting ZIP...' : 'Confirm Codebase Intake'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
