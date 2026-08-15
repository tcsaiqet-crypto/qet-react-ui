import React from 'react';
import { CheckCircle2, ChevronRight, Clock, Cpu, Loader2, ShieldAlert } from 'lucide-react';
import { AppState } from '../types';
import { resolveAgentFlow } from '../services/agentFlow';

interface ActiveProcessBarProps {
  appState: AppState | null;
}

export const ActiveProcessBar: React.FC<ActiveProcessBarProps> = ({ appState }) => {
  const flow = resolveAgentFlow(appState);
  const isRunning = flow.activeStatus === 'running';
  const isFailed = flow.activeStatus === 'failed' || flow.activeStatus === 'blocked';
  const isCompleted = flow.activeStatus === 'completed';

  const accent = isFailed
    ? 'var(--qet-danger)'
    : isCompleted
    ? 'var(--qet-success)'
    : isRunning
    ? 'var(--qet-accent)'
    : 'var(--qet-text-muted)';

  const statusIcon = isRunning ? (
    <Loader2 className="h-4 w-4 animate-spin" style={{ color: accent }} />
  ) : isFailed ? (
    <ShieldAlert className="h-4 w-4" style={{ color: accent }} />
  ) : isCompleted ? (
    <CheckCircle2 className="h-4 w-4" style={{ color: accent }} />
  ) : (
    <Clock className="h-4 w-4" style={{ color: accent }} />
  );

  return (
    <div
      data-testid="active-process-bar"
      className="flex flex-col gap-2 rounded-xl border px-4 py-3 shadow-sm"
      style={{
        backgroundColor: 'var(--qet-surface)',
        borderColor: 'var(--qet-border)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      {/* Top row: Agent and Status */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--qet-text-muted)' }}
          >
            Active Agent
          </span>
        </div>

        <span className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>
          {flow.activeStage.label}
        </span>

        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--qet-text-muted)' }} />

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-bold"
            style={{ backgroundColor: 'var(--qet-surface-elevated)', color: 'var(--qet-text-secondary)' }}
          >
            <Cpu className="h-3 w-3" />
            Step {flow.activeIndex + 1} / {flow.totalCount}
          </span>
          <span
            className="rounded-md px-2 py-1 font-mono text-[10px] font-bold"
            style={{ backgroundColor: 'var(--qet-accent-subtle)', color: 'var(--qet-accent-text)' }}
          >
            {(appState?.progress ?? 0).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Bottom row: Subagent Process */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2" style={{ borderColor: 'var(--qet-border)' }}>
        <span
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--qet-text-muted)' }}
        >
          Subagent:
        </span>
        <span
          data-testid="active-process-subagent"
          className="text-sm font-semibold italic"
          style={{ color: accent }}
        >
          {flow.activeSubagentLabel}
        </span>
        <span
          data-testid="active-process-message"
          className="min-w-0 flex-1 truncate text-xs"
          style={{ color: 'var(--qet-text-secondary)' }}
        >
          {flow.activeProcessMessage}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--qet-surface-elevated)' }}>
        <div
          className={`h-full rounded-full ${isRunning ? 'qet-progress-active' : ''}`}
          style={{
            width: `${Math.min(100, Math.max(0, appState?.progress ?? 0))}%`,
            backgroundColor: accent,
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
};
