import React, { useEffect, useState } from 'react';
import { 
  Clock3, 
  FolderKanban, 
  RefreshCcw, 
  ArrowRight, 
  FileText, 
  BrainCircuit, 
  FileCode, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { listRuns } from '../services/apiClient';
import { RunSummary } from '../types';

interface RunsDashboardProps {
  onOpenRun: (runId: string) => void;
  activeRunId?: string;
}

export const RunsDashboard: React.FC<RunsDashboardProps> = ({ onOpenRun, activeRunId }) => {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRuns();
      setRuns(data.runs || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load previous runs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="qet-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-semibold qet-badge-accent">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Previous Runs</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--qet-text-primary)' }}>
              Run History Dashboard
            </h2>
            <p className="max-w-2xl text-xs" style={{ color: 'var(--qet-text-muted)' }}>
              Browse earlier runs, reopen them into the execution workspace, and inspect generated report artifacts.
            </p>
          </div>
          <button
            onClick={() => void loadRuns()}
            className="qet-btn-secondary inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="qet-panel p-10 text-center text-xs" style={{ color: 'var(--qet-text-muted)' }}>
          Loading runs...
        </div>
      ) : error ? (
        <div className="qet-badge-danger p-6 text-sm">{error}</div>
      ) : runs.length === 0 ? (
        <div className="qet-panel p-10 text-center text-xs" style={{ color: 'var(--qet-text-muted)' }}>
          No prior runs found yet. Create a new run from the Home tab to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {runs.map((run) => {
            const isActive = activeRunId === run.run_id;
            return (
              <div
                key={run.run_id}
                className={`qet-panel p-5 space-y-4 transition-all ${
                  isActive ? 'ring-2 ring-blue-500/50 shadow-md' : ''
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                      {run.project_name}
                    </div>
                    <div className="font-mono text-sm font-bold" style={{ color: 'var(--qet-accent)' }}>
                      {run.run_id}
                    </div>
                  </div>
                  {isActive ? (
                    <span className="qet-badge-accent px-2.5 py-1 text-[11px] font-bold">
                      Active Workspace
                    </span>
                  ) : (
                    <span className="qet-badge-neutral px-2 py-0.5 text-[11px] font-medium">
                      {run.status}
                    </span>
                  )}
                </div>

                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="qet-card-elevated px-2.5 py-1 font-semibold" style={{ color: 'var(--qet-text-primary)' }}>
                    Progress: {run.progress}%
                  </span>
                  <span className="qet-card-elevated px-2.5 py-1" style={{ color: 'var(--qet-text-secondary)' }}>
                    Codebase: {run.total_files} files
                  </span>
                  <span className="qet-card-elevated px-2.5 py-1" style={{ color: 'var(--qet-text-secondary)' }}>
                    Requirements: {run.doc_count} docs
                  </span>
                  {run.has_understanding && (
                    <span className="qet-badge-accent px-2 py-0.5 text-[11px] inline-flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" />
                      <span>Understanding Ready</span>
                    </span>
                  )}
                </div>

                {/* Reports / Artifacts Links */}
                {(run.has_html_report || run.has_pdf_report) && (
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--qet-text-muted)' }}>
                      Saved Artifacts:
                    </span>
                    {run.has_html_report && (
                      <a
                        href={`/api/v1/runs/${run.run_id}/reports/quality_report.html`}
                        target="_blank"
                        rel="noreferrer"
                        className="qet-badge-success px-2 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>HTML Report</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    )}
                    {run.has_pdf_report && (
                      <a
                        href={`/api/v1/runs/${run.run_id}/reports/quality_report.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="qet-badge-accent px-2 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PDF Report</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Actions */}
                <div
                  className="mt-3 pt-3 flex items-center justify-between text-xs border-t"
                  style={{ borderColor: 'var(--qet-border)', color: 'var(--qet-text-muted)' }}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{run.updated_at ? new Date(run.updated_at).toLocaleString() : (run.created_at ? new Date(run.created_at).toLocaleString() : 'Unknown')}</span>
                  </div>
                  <button
                    onClick={() => onOpenRun(run.run_id)}
                    className="qet-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <span>Open in Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
