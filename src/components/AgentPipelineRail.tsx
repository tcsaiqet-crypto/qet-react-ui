import React from 'react';
import { CheckCircle2, Clock, Layers, Loader2, ShieldAlert, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { AppState, AgentStatus, RailViewMode } from '../types';
import { resolveAgentFlow, RailStage } from '../services/agentFlow';

interface AgentPipelineRailProps {
  appState: AppState | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  viewMode?: RailViewMode;
  onToggleViewMode?: (mode: RailViewMode) => void;
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

export const AgentPipelineRail: React.FC<AgentPipelineRailProps> = ({
  appState,
  selectedAgentId,
  onSelectAgent,
  viewMode = 'full_pipeline',
  onToggleViewMode,
}) => {
  const flow = resolveAgentFlow(appState, viewMode);
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
    understandingCompletedCount,
  } = flow;
  const fallbackSubagent = activeStage.subagents[0];

  const handleStageClick = (stage: RailStage) => {
    if (onSelectAgent) {
      onSelectAgent(stage.id);
    }
  };

  const isSelected = (stageId: string) => selectedAgentId === stageId;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-72" aria-label="QET agent execution rail">
      <div
        className="rounded-2xl border p-4 shadow-sm transition-colors"
        style={{ backgroundColor: 'var(--qet-surface)', borderColor: 'var(--qet-border)' }}
      >
        {/* Rail Header */}
        <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--qet-border)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'var(--qet-accent-subtle)', border: '1px solid var(--qet-accent-border)' }}
            >
              <Layers className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate" style={{ color: 'var(--qet-text-primary)' }}>QET Agent Flow</h2>
              <p className="text-[10px]" style={{ color: 'var(--qet-text-muted)' }}>
                {viewMode === 'understanding_focus'
                  ? `${understandingCompletedCount} of 3 understanding done`
                  : `${flow.completedCount} of ${flow.totalCount} complete`}
              </p>
            </div>
          </div>

          {/* Quick Inspector Cue Badge */}
          {selectedAgentId && (
            <span className="qet-badge-accent text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Inspecting
            </span>
          )}
        </div>

        {/* View Mode Toggle Switcher */}
        <div
          className="mb-3 flex items-center rounded-lg p-0.5"
          style={{ backgroundColor: 'var(--qet-surface-elevated)', border: '1px solid var(--qet-border)' }}
        >
          <button
            type="button"
            onClick={() => onToggleViewMode?.('understanding_focus')}
            className={`flex-1 rounded-md py-1 text-[10px] font-semibold transition-all ${
              viewMode === 'understanding_focus'
                ? 'qet-badge-accent shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Understanding
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode?.('full_pipeline')}
            className={`flex-1 rounded-md py-1 text-[10px] font-semibold transition-all ${
              viewMode === 'full_pipeline'
                ? 'qet-badge-accent shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 11 Stages
          </button>
        </div>

        {/* Stage List with Interactive Selection */}
        <div className="space-y-1.5" data-testid="agent-pipeline-rail">
          {stages.map((stage, order) => {
            const status = statuses[order] || 'pending';
            const isActiveHero = order === activeIndex;
            const selected = isSelected(stage.id);

            // Dynamic card style
            let cardBg = 'var(--qet-surface-elevated)';
            let borderColor = 'var(--qet-border)';
            let textColor = 'var(--qet-text-muted)';

            if (selected) {
              borderColor = 'var(--qet-accent)';
              cardBg = 'var(--qet-surface-elevated)';
            } else if (status === 'completed') {
              cardBg = 'var(--qet-success-subtle)';
              borderColor = 'var(--qet-success-border)';
              textColor = 'var(--qet-text-secondary)';
            } else if (isActiveHero) {
              cardBg = 'var(--qet-accent-subtle)';
              borderColor = 'var(--qet-accent-border)';
              textColor = 'var(--qet-text-primary)';
            }

            return (
              <div
                key={stage.id}
                role="button"
                tabIndex={0}
                onClick={() => handleStageClick(stage)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStageClick(stage);
                  }
                }}
                data-testid={isActiveHero ? 'agent-pipeline-active' : `agent-stage-${stage.id}`}
                className={`animate-rail-item group relative rounded-xl border p-2.5 transition-all duration-200 cursor-pointer ${
                  selected
                    ? 'ring-2 ring-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'hover:border-blue-400/50 hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor,
                  animationDelay: `${order * 30}ms`,
                }}
              >
                {/* Active / Selection Indicator Dot */}
                {selected && (
                  <div
                    className="absolute -left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ backgroundColor: 'var(--qet-accent)' }}
                  />
                )}

                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {statusIcon(status)}
                    <span
                      className={`text-xs truncate ${selected || isActiveHero ? 'font-bold' : 'font-medium'}`}
                      style={{ color: selected ? 'var(--qet-accent)' : textColor }}
                    >
                      {stage.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded" style={{ color: 'var(--qet-text-muted)' }}>
                      {order + 1}
                    </span>
                    {isActiveHero && status === 'running' && (
                      <span className="qet-badge-accent text-[8px] font-bold px-1 rounded uppercase">Live</span>
                    )}
                  </div>
                </div>

                {/* Subagents Preview */}
                {stage.subagents.length > 0 && (
                  <SubagentList names={stage.subagents} status={status} />
                )}

                {/* Active Activity Callout when this stage is active and running */}
                {isActiveHero && activeSubagent && (
                  <div
                    className="mt-2 border-l-2 pl-2 text-[10px] italic leading-tight animate-hero-enter"
                    style={{ color: 'var(--qet-accent-text)', borderColor: 'var(--qet-accent-border)' }}
                  >
                    <span className="font-semibold not-italic">Subagent:</span> {activeSubagent.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

