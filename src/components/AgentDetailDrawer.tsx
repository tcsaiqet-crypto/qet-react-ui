import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Layers, 
  Activity, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert, 
  Clock, 
  Sparkles,
  Cpu,
  Code2,
  FileCheck2,
  AlertTriangle,
  FolderArchive,
  ExternalLink
} from 'lucide-react';
import { AppState, DrawerTabId, AgentStatus } from '../types';
import { resolveSelectedAgentContext } from '../services/agentFlow';

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgentId: string | null;
  appState: AppState | null;
  onRetryAgent?: (agentId: string) => Promise<void>;
  activeTab?: DrawerTabId;
  onTabChange?: (tab: DrawerTabId) => void;
}

export const AgentDetailDrawer: React.FC<AgentDetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedAgentId,
  appState,
  onRetryAgent,
  activeTab = 'overview',
  onTabChange,
}) => {
  const [currentTab, setCurrentTab] = useState<DrawerTabId>(activeTab);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);

  const tab = onTabChange ? activeTab : currentTab;
  const setTab = (newTab: DrawerTabId) => {
    if (onTabChange) onTabChange(newTab);
    else setCurrentTab(newTab);
  };

  const context = resolveSelectedAgentContext(appState, selectedAgentId);

  if (!isOpen || !context) {
    return null;
  }

  const handleCopyPayload = () => {
    const payload = context.artifacts_summary.data_payload || context;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleExecuteRetry = async () => {
    if (!onRetryAgent || !selectedAgentId) return;
    setIsRetrying(true);
    try {
      await onRetryAgent(selectedAgentId);
      setShowRetryConfirm(false);
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  const statusColor = (status: AgentStatus | string) => {
    if (status === 'completed') return 'var(--qet-success)';
    if (status === 'running') return 'var(--qet-accent)';
    if (status === 'failed' || status === 'blocked') return 'var(--qet-danger)';
    return 'var(--qet-text-muted)';
  };

  const tabs: Array<{ id: DrawerTabId; label: string; icon: React.FC<any> }> = [
    { id: 'overview', label: 'Inputs & Overview', icon: FileText },
    { id: 'subagents', label: 'Subagents & Logs', icon: Activity },
    { id: 'artifacts', label: 'Outputs & Artifacts', icon: Code2 },
    { id: 'actions', label: 'Actions & Controls', icon: RotateCcw },
  ];

  return (
    <aside
      aria-label="Agent Detail Inspector"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-2xl transition-all duration-300 xl:sticky xl:top-24 xl:z-30 xl:h-[calc(100vh-7rem)] xl:rounded-2xl xl:border xl:shadow-lg"
      style={{
        backgroundColor: 'var(--qet-surface)',
        borderColor: 'var(--qet-border)',
      }}
    >
      {/* ── 1. Drawer Header ─────────────────────────────────────────────── */}
      <div className="border-b p-4" style={{ borderColor: 'var(--qet-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="qet-badge-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Phase: {context.phase}
              </span>
              <span
                className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${statusColor(context.status)}15`,
                  color: statusColor(context.status),
                }}
              >
                {context.status}
              </span>
            </div>
            <h3 className="text-base font-bold tracking-tight truncate" style={{ color: 'var(--qet-text-primary)' }}>
              {context.label}
            </h3>
            <p className="text-xs truncate" style={{ color: 'var(--qet-text-muted)' }}>
              Step {context.step_number} of 11 &bull; {context.description}
            </p>
          </div>

          <button
            onClick={onClose}
            title="Close Inspector"
            className="rounded-lg p-1.5 transition-colors hover:opacity-75 cursor-pointer shrink-0"
            style={{ color: 'var(--qet-text-muted)', backgroundColor: 'var(--qet-surface-elevated)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
        <div className="mt-4 flex gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'var(--qet-surface-elevated)' }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  isActive ? 'qet-badge-accent shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Tab Content Area ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── TAB 1: Inputs & Overview ─────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* Input Files Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                Input Assets & Specifications
              </div>
              {context.inputs_summary.files && context.inputs_summary.files.length > 0 ? (
                <div className="space-y-1.5">
                  {context.inputs_summary.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xs"
                      style={{
                        backgroundColor: 'var(--qet-surface-elevated)',
                        borderColor: 'var(--qet-border)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                        <span className="font-mono truncate font-medium" style={{ color: 'var(--qet-text-primary)' }}>
                          {file.name}
                        </span>
                      </div>
                      {file.size_bytes !== undefined && file.size_bytes > 0 && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {(file.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border text-xs text-slate-400 text-center" style={{ borderColor: 'var(--qet-border)' }}>
                  Awaiting input upload or upstream stage inputs.
                </div>
              )}
            </div>

            {/* Stage Parameters */}
            {context.inputs_summary.parameters && Object.keys(context.inputs_summary.parameters).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                  Configuration & Stage Parameters
                </div>
                <div
                  className="p-3 rounded-lg border font-mono text-[11px] space-y-1"
                  style={{ backgroundColor: 'var(--qet-surface-elevated)', borderColor: 'var(--qet-border)' }}
                >
                  {Object.entries(context.inputs_summary.parameters).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-slate-400">{key}:</span>
                      <span className="font-semibold text-blue-400 truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Subagents & Logs ──────────────────────────────────────── */}
        {tab === 'subagents' && (
          <div className="space-y-4 animate-fade-in">
            {/* Subagents Progress List */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                Subagent Tasks & Progression
              </div>
              <div className="space-y-2">
                {context.subagents.map((sub, idx) => (
                  <div
                    key={sub.subagent_id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--qet-surface-elevated)',
                      borderColor: 'var(--qet-border)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${statusColor(sub.status)}15`,
                          color: statusColor(sub.status),
                        }}
                      >
                        {sub.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : sub.status === 'running' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: 'var(--qet-text-primary)' }}>
                          {sub.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {sub.message || `Subagent task #${idx + 1}`}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: `${statusColor(sub.status)}15`,
                        color: statusColor(sub.status),
                      }}
                    >
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Console Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                  Live Execution Telemetry
                </div>
                <Terminal className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto border border-slate-800">
                {context.execution_logs.length > 0 ? (
                  context.execution_logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-emerald-400">&gt;</span> {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">No console logs captured for this stage yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Outputs & Artifacts ───────────────────────────────────── */}
        {tab === 'artifacts' && (
          <div className="space-y-4 animate-fade-in">
            {/* 15-Point Checklist Evaluation Matrix (if present) */}
            {context.artifacts_summary.checklist_evaluation && context.artifacts_summary.checklist_evaluation.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                  15-Point Requirement Checklist
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {context.artifacts_summary.checklist_evaluation.map((chk) => (
                    <div
                      key={chk.check_id}
                      className="p-2.5 rounded-lg border text-xs space-y-1"
                      style={{
                        backgroundColor: 'var(--qet-surface-elevated)',
                        borderColor: 'var(--qet-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[11px]" style={{ color: 'var(--qet-text-primary)' }}>
                          {chk.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            chk.status === 'pass'
                              ? 'qet-badge-success'
                              : chk.status === 'fail'
                              ? 'qet-badge-danger'
                              : 'qet-badge-accent'
                          }`}
                        >
                          {chk.status} ({chk.score}%)
                        </span>
                      </div>
                      {chk.findings && (
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {chk.findings}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Data Payload Tree */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                  Synthesized Output Payload
                </div>
                <button
                  onClick={handleCopyPayload}
                  className="qet-btn-secondary inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded cursor-pointer"
                >
                  {copiedPayload ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre
                className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-blue-300 max-h-64 overflow-y-auto border border-slate-800 leading-relaxed"
              >
                {JSON.stringify(context.artifacts_summary.data_payload || context, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ── TAB 4: Actions & Controls ────────────────────────────────────── */}
        {tab === 'actions' && (
          <div className="space-y-4 animate-fade-in">
            {/* Stage Retry Card */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--qet-surface-elevated)',
                borderColor: 'var(--qet-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Retry Stage & Re-evaluate
                </h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Re-executing this agent will re-run its subagents and safely invalidate all downstream dependent outputs to prevent state corruption.
              </p>

              {showRetryConfirm ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-start gap-1.5 text-xs text-amber-400 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Confirm stage re-run? Downstream test cases and scripts will be re-generated.</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleExecuteRetry}
                      disabled={isRetrying}
                      className="qet-btn-primary px-3 py-1 text-xs font-bold rounded cursor-pointer inline-flex items-center gap-1"
                    >
                      {isRetrying && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Yes, Retry Now</span>
                    </button>
                    <button
                      onClick={() => setShowRetryConfirm(false)}
                      className="qet-btn-secondary px-3 py-1 text-xs font-semibold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowRetryConfirm(true)}
                  disabled={!context.retryable}
                  className="qet-btn-secondary w-full py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                  <span>Request Stage Re-run</span>
                </button>
              )}
            </div>

            {/* Export & Download Artifact */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: 'var(--qet-surface-elevated)',
                borderColor: 'var(--qet-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold" style={{ color: 'var(--qet-text-primary)' }}>
                  Export Artifact Payload
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Download the JSON manifest of all extracted entities, AST nodes, and checklist evaluations.
              </p>
              <button
                onClick={handleCopyPayload}
                className="qet-btn-secondary w-full py-2 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="h-3.5 w-3.5 text-blue-400" />
                <span>Copy Full JSON to Clipboard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Drawer Footer ─────────────────────────────────────────────── */}
      <div
        className="border-t p-3 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--qet-border)', backgroundColor: 'var(--qet-surface-elevated)' }}
      >
        <span className="text-[10px] text-slate-400">
          Selected: <strong className="font-mono text-blue-400">{context.agent_id}</strong>
        </span>
        <button
          onClick={onClose}
          className="text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
          style={{ color: 'var(--qet-accent)' }}
        >
          <span>Done</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};
