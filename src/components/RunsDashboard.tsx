import React, { useEffect, useState } from 'react';
import { Clock3, FolderKanban, RefreshCcw, ArrowRight } from 'lucide-react';
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
      setRuns(data.runs);
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
      <div className="qet-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Previous Runs</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Run history dashboard</h2>
            <p className="max-w-2xl text-sm text-slate-400">Browse earlier runs, reopen them, and continue analysis without re-uploading the same files.</p>
          </div>
          <button
            onClick={() => void loadRuns()}
            className="qet-btn-secondary inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="qet-panel p-10 text-sm qet-text-muted">Loading runs...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-800/50 bg-rose-950/30 p-6 text-sm text-rose-300">{error}</div>
      ) : runs.length === 0 ? (
        <div className="qet-panel p-10 text-sm qet-text-muted">No prior runs found yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {runs.map((run) => {
            const isActive = activeRunId === run.run_id;
            return (
              <div
                key={run.run_id}
                className={`p-5 shadow-lg transition-all ${isActive ? 'qet-card border-cyan-600 bg-cyan-950/15' : 'qet-card'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{run.project_name}</div>
                    <div className="font-mono text-sm font-bold text-cyan-300">{run.run_id}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="qet-pill px-2.5 py-1">Status: {run.status}</span>
                      <span className="qet-pill px-2.5 py-1">Progress: {run.progress}%</span>
                      <span className="qet-pill px-2.5 py-1">Files: {run.total_files}</span>
                      <span className="qet-pill px-2.5 py-1">Docs: {run.doc_count}</span>
                    </div>
                  </div>
                  {isActive && <span className="rounded-full border border-cyan-700 bg-cyan-950/50 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">Active</span>}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{run.updated_at || run.created_at || 'Unknown time'}</span>
                  </div>
                  <button
                    onClick={() => onOpenRun(run.run_id)}
                    className="qet-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                  >
                    <span>Open run</span>
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
