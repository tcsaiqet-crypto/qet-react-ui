import React from 'react';
import { CheckCircle2, Clock, Layers, Loader2, ShieldAlert } from 'lucide-react';
import { AppState, AgentStatus } from '../types';
import { resolveAgentFlow } from '../services/agentFlow';

interface AgentPipelineRailProps {
  appState: AppState | null;
}

const statusIcon = (status: AgentStatus) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--qet-success)' }} />;
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--qet-accent)' }} />;
  if (status === 'failed' || status === 'blocked') return <ShieldAlert className="h-4 w-4" style={{ color: 'var(--qet-danger)' }} />;
  return <Clock className="h-4 w-4" style={{ color: 'var(--qet-text-muted)' }} />;
};

const subagentDot = (status: AgentStatus) => {
  const color =
    status === 'completed'
      ? 'var(--qet-success)'
      : status === 'running'
      ? 'var(--qet-accent)'
      : status === 'failed' || status === 'blocked'
      ? 'var(--qet-danger)'
      : 'var(--qet-text-muted)';
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === 'running' ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: color }}
    />
  );
};

const SubagentList: React.FC<{ names: string[]; status: AgentStatus }> = ({ names, status }) => (
  <div className="mt-1.5 space-y-1 pl-5">
    {names.map((name) => (
      <div
        key={name}
        className="flex items-center gap-1.5 text-[10px] italic leading-tight"
        style={{ color: 'var(--qet-text-muted)' }}
      >
        {subagentDot(status)}
        <span className="truncate">{name}</span>
      </div>
    ))}
  </div>
);

export const AgentPipelineRail: React.FC<AgentPipelineRailProps> = ({ appState }) => {
  const flow = resolveAgentFlow(appState);
  const {
    stages,
    statuses,
    activeIndex,
    activeStage,
    activeStatus,
    activeSubagentTimeline,
    activeSubagent,
    completedStages,
    upcomingStages,
  } = flow;
  const fallbackSubagent = activeStage.subagents[0];

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72" aria-label="QET agent execution rail">
      <div
        className="rounded-2xl border p-4 shadow-sm transition-colors"
        style={{ backgroundColor: 'var(--qet-surface)', borderColor: 'var(--qet-border)' }}
      >
        <div className="mb-4 flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--qet-border)' }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
          >
            <Layers className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold" style={{ color: 'var(--qet-text-primary)' }}>QET Agent Flow</h2>
            <p className="text-[10px]" style={{ color: 'var(--qet-text-muted)' }}>
              {flow.completedCount} of {flow.totalCount} complete
            </p>
          </div>
        </div>

        <div className="space-y-1.5" data-testid="agent-pipeline-rail">
          {completedStages.map((stage, order) => {
            const stageIndex = stages.indexOf(stage);
            return (
              <div
                key={stage.id}
                className="animate-rail-item rounded-lg border px-2.5 py-2"
                style={{
                  backgroundColor: 'var(--qet-success-subtle)',
                  borderColor: 'var(--qet-success-border)',
                  animationDelay: `${order * 40}ms`,
                }}
              >
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--qet-text-secondary)' }}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--qet-success)' }} />
                  <span className="min-w-0 flex-1 truncate">{stage.label}</span>
                  <span className="text-[9px] uppercase" style={{ color: 'var(--qet-text-muted)' }}>{stageIndex + 1}</span>
                </div>
                <SubagentList names={stage.subagents} status="completed" />
              </div>
            );
          })}

          <div
            className="animate-hero-enter my-2 rounded-xl border p-3 shadow-sm"
            style={{ backgroundColor: 'var(--qet-accent-subtle)', borderColor: 'var(--qet-accent-border)' }}
            data-testid="agent-pipeline-active"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--qet-accent-text)' }}>{activeStage.phase}</span>
              {statusIcon(activeStatus)}
            </div>
            <div
              className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-bold leading-tight"
              style={{ backgroundColor: 'var(--qet-surface)', color: 'var(--qet-text-primary)' }}
            >
              {activeStatus === 'running' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: 'var(--qet-accent)' }} />}
              <span className="min-w-0 truncate">{activeStage.label}</span>
            </div>
            <div
              className="mt-2 border-l-2 pl-2 text-[11px] italic leading-tight"
              style={{ color: 'var(--qet-accent-text)', borderColor: 'var(--qet-accent-border)' }}
            >
              <span className="font-semibold not-italic" style={{ color: 'var(--qet-text-secondary)' }}>Subagent:</span>{' '}
              {activeSubagent?.label || fallbackSubagent || activeStage.description}
            </div>
            <div className="mt-2 text-[10px] leading-tight" style={{ color: 'var(--qet-text-secondary)' }}>{activeSubagent?.message || activeStage.description}</div>

            {activeSubagentTimeline.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-2" style={{ borderColor: 'var(--qet-accent-border)' }}>
                <div className="mb-1.5 text-[9px] font-semibold uppercase" style={{ color: 'var(--qet-text-muted)' }}>Subagents Status:</div>
                {activeSubagentTimeline.map((subagent, order) => (
                  <div
                    key={subagent.subagent_id}
                    className="animate-rail-item flex items-center gap-1.5 pl-1 text-[10px]"
                    style={{ color: 'var(--qet-text-secondary)', animationDelay: `${order * 60}ms` }}
                  >
                    {subagentDot(subagent.status)}
                    <span className="font-medium italic">{subagent.label}</span>
                    <span className="ml-auto text-[9px]" style={{ color: 'var(--qet-text-muted)' }}>{subagent.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {upcomingStages.map((stage, index) => {
            const stageIndex = stages.indexOf(stage);
            if (stageIndex === activeIndex) return null;
            return (
              <div
                key={stage.id}
                className="animate-rail-item rounded-lg border px-2.5 py-2 transition-colors"
                style={{
                  backgroundColor: 'var(--qet-surface-elevated)',
                  borderColor: 'var(--qet-border)',
                  animationDelay: `${index * 40}ms`,
                }}
              >
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--qet-text-muted)' }}>
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px]"
                    style={{ borderColor: 'var(--qet-border)' }}
                  >
                    {stageIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{stage.label}</span>
                  {index === 1 && <span className="text-[9px] uppercase" style={{ color: 'var(--qet-text-muted)' }}>Next</span>}
                </div>
                <SubagentList names={stage.subagents} status="pending" />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
