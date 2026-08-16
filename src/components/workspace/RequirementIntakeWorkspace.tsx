import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { uploadDocuments } from '../../services/apiClient';
import { AppState } from '../../types';

interface RequirementIntakeWorkspaceProps {
  appState: AppState | null;
  onRefresh: (runId: string) => Promise<void>;
  onProceedNext: () => void;
}

export const RequirementIntakeWorkspace: React.FC<RequirementIntakeWorkspaceProps> = ({
  appState,
  onRefresh,
  onProceedNext,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; content: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const existingDocFiles = appState?.intake_manifest?.doc_files || [];
  const isCompleted = existingDocFiles.length > 0 || selectedFiles.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      addFiles(filesArray);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validExtensions = ['.md', '.txt', '.pdf', '.docx', '.json'];
    const valid = newFiles.filter((f) =>
      validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (valid.length < newFiles.length) {
      setUploadError('Some files were ignored. Only .md, .txt, .pdf, .docx, and .json are supported.');
    } else {
      setUploadError(null);
    }
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = valid.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndConfirm = async () => {
    if (!appState?.run_id) return;
    if (selectedFiles.length === 0 && existingDocFiles.length === 0) {
      setUploadError('Please select at least one requirement document.');
      return;
    }

    if (selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        setUploadError(null);
        await uploadDocuments(appState.run_id, selectedFiles);
        await onRefresh(appState.run_id);
        setIsUploading(false);
        onProceedNext();
      } catch (err: any) {
        setIsUploading(false);
        setUploadError(err.message || 'Failed to upload documents.');
      }
    } else {
      onProceedNext();
    }
  };

  const handlePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewFile({
        name: file.name,
        content: e.target?.result as string || 'Unable to display content.',
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header Banner */}
      <div className="qet-panel p-6 border-l-4 border-slate-700 bg-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="qet-badge-primary text-[10px] uppercase font-bold px-2 py-0.5">
                Sub-Agent 1a
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Requirement Intake Sub-Agent
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Ingest application requirements, user stories, acceptance criteria, and API contracts.
            </p>
          </div>
          {isCompleted && (
            <span className="qet-badge-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Ready for Analysis</span>
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
        onClick={() => document.getElementById('req-file-input')?.click()}
      >
        <input
          type="file"
          id="req-file-input"
          multiple
          className="hidden"
          accept=".md,.txt,.pdf,.docx,.json"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-700">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Drag and drop requirement documents here, or <span className="text-slate-800 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500">
              Supported: Markdown (.md), Plain Text (.txt), PDF (.pdf), Word (.docx), JSON (.json) • Max 20 files
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="qet-badge-danger p-4 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Documents List */}
      {(selectedFiles.length > 0 || existingDocFiles.length > 0) && (
        <div className="qet-card p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <FileCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>Uploaded Requirements ({selectedFiles.length || existingDocFiles.length} files)</span>
            </h3>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePreview(file)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                      title="Preview content"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              existingDocFiles.map((filename, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    <span className="text-xs font-semibold truncate text-slate-900">
                      {filename}
                    </span>
                  </div>
                  <span className="qet-badge-success text-[10px] uppercase font-bold px-2 py-0.5">
                    Saved
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="qet-panel w-full max-w-2xl max-h-[80vh] flex flex-col p-6 space-y-4 shadow-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>{previewFile.name}</span>
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                Close (Esc)
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap border border-slate-200">
              {previewFile.content}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Progression CTA */}
      <div className="qet-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 bg-white">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Step 1a: Requirement Documents Intake
            </h4>
            <span className="qet-badge-success text-[10px] font-bold px-2 py-0.5">
              Next: Codebase Intake
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Confirm requirements to proceed to codebase ZIP extraction and indexing.
          </p>
        </div>
        <button
          onClick={handleUploadAndConfirm}
          disabled={isUploading || (!selectedFiles.length && !existingDocFiles.length)}
          className="qet-btn-success inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isUploading ? 'Uploading...' : 'Confirm Requirement Intake'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
