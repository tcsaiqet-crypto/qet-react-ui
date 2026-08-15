import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Layers, Loader2, ShieldAlert, ChevronRight, Play, Eye } from 'lucide-react';
import { AppState, AgentStatus, RailViewMode } from '../types';
import { resolveAgentFlow, RailStage } from '../services/agentFlow';

interface AgentPipelineRailProps {
  appState: AppState | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  onRunStage?: (stageId: string) => void;
  viewMode?: RailViewMode;
  onToggleViewMode?: (mode: RailViewMode) => void;
}

const statusIcon = (status: AgentStatus) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--qet-success)' }} />;
  if (status === 'running') return <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: 'var(--qet-accent)' }} />;
  if (status === 'failed' || status === 'blocked') return <ShieldAlert className="h-4 w-4 shrink-0" style={{ color: 'var(--qet-danger)' }} />;
  return <Clock className="h-4 w-4 shrink-0" style={{ color: 'var(--qet-text-muted)' }} />;
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

const SubagentList: React.FC<{ names: string[]; status: AgentStatus; activeSubagentName?: string }> = ({
  names,
  status,
  activeSubagentName,
}) => (
  <div className="mt-2 space-y-1.5 pl-3 border-l-2" style={{ borderColor: 'var(--qet-border)' }}>
    {names.map((name) => {
      const isCurrentSubagent = activeSubagentName && name.toLowerCase().includes(activeSubagentName.toLowerCase());
      return (
        <div
          key={name}
          className={`flex items-center justify-between gap-1.5 text-[11px] leading-tight px-1.5 py-0.5 rounded transition-colors ${
            isCurrentSubagent ? 'font-semibold bg-blue-50/50 dark:bg-blue-900/20' : ''
          }`}
          style={{ color: isCurrentSubagent ? 'var(--qet-accent)' : 'var(--qet-text-muted)' }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {subagentDot(isCurrentSubagent ? 'running' : status)}
            <span className="truncate">{name}</span>
          </div>
          {status === 'completed' && <span className="text-[9px] text-emerald-600 font-medium">✓</span>}
        </div>
      );
    })}
  </div>
);

export const AgentPipelineRail: React.FC<AgentPipelineRailProps> = ({
  appState,
  selectedAgentId,
  onSelectAgent,
  onRunStage,
  viewMode = 'full_pipeline',
  onToggleViewMode,
}) => {
  const flow = resolveAgentFlow(appState, viewMode);
  const {
    stages,
    statuses,
    activeIndex,
    activeStage,
    activeSubagent,
    understandingCompletedCount,
  } = flow;

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-Scroll to Active Stage
  useEffect(() => {
    if (activeIndex >= 0 && cardRefs.current[activeIndex]) {
      cardRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  const handleStageClick = (stage: RailStage) => {
    if (onSelectAgent) {
      onSelectAgent(stage.id);
    }
  };

  const isSelected = (stageId: string) => selectedAgentId === stageId;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80" aria-label="QET agent execution rail">
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

          {selectedAgentId && (
            <span className="qet-badge-accent text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Inspecting
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
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
            All Pipeline
          </button>
        </div>

        {/* Agent Cards with Auto-Collapse & Smooth Animation */}
        <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1" data-testid="agent-pipeline-rail">
          {stages.map((stage, order) => {
            const status = statuses[order] || 'pending';
            const isActiveHero = order === activeIndex;
            const selected = isSelected(stage.id);
            const isCompleted = status === 'completed';
            const isExpanded = isActiveHero || selected || (!isCompleted && order <= activeIndex + 1);

            // Card theme classes
            let cardBg = 'var(--qet-surface-elevated)';
            let borderColor = 'var(--qet-border)';
            let textColor = 'var(--qet-text-muted)';

            if (selected) {
              borderColor = 'var(--qet-accent)';
              cardBg = 'var(--qet-surface-elevated)';
            } else if (isCompleted) {
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
                ref={(el) => (cardRefs.current[order] = el)}
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
                className={`group relative rounded-xl border p-2.5 transition-all duration-300 cursor-pointer ${
                  selected
                    ? 'ring-2 ring-blue-500/50 shadow-md'
                    : 'hover:border-blue-400/50 hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor,
                }}
              >
                {/* Active Indicator Bar */}
                {selected && (
                  <div
                    className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ backgroundColor: 'var(--qet-accent)' }}
                  />
                )}

                {/* Stage Header Line */}
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
                    {isCompleted && !isExpanded && (
                      <span className="text-[9px] text-emerald-600 font-semibold px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                        Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Section (Nested Subagents & Single Action Button) */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t transition-all duration-200" style={{ borderColor: 'var(--qet-border)' }}>
                    {stage.subagents.length > 0 && (
                      <SubagentList
                        names={stage.subagents}
                        status={status}
                        activeSubagentName={isActiveHero && activeSubagent ? activeSubagent.label : undefined}
                      />
                    )}

                    {/* Strict One Primary Action Button Rule */}
                    <div className="mt-2.5">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all border shadow-xs"
                          style={{
                            backgroundColor: 'var(--qet-surface)',
                            borderColor: 'var(--qet-border)',
                            color: 'var(--qet-text-primary)',
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Results
                        </button>
                      ) : isActiveHero ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRunStage) onRunStage(stage.id);
                            else handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold text-white transition-all shadow-xs"
                          style={{ backgroundColor: 'var(--qet-accent)' }}
                        >
                          {status === 'running' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Running Stage...
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              Run Stage
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1 rounded-lg py-1 px-2 text-[10px] font-medium transition-all text-slate-400 hover:text-slate-600"
                        >
                          Select Stage <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
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
