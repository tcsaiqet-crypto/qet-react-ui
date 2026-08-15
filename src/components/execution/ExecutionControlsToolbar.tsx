import React from 'react';
import { ExecutionStatus } from '../../types';

interface ExecutionControlsToolbarProps {
  status: ExecutionStatus;
  executionId?: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRunAll: () => void;
  isLoading?: boolean;
}

export const ExecutionControlsToolbar: React.FC<ExecutionControlsToolbarProps> = ({
  status,
  executionId,
  onPause,
  onResume,
  onStop,
  onRunAll,
  isLoading = false,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isQueued = status === 'queued';

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-600 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            RUNNING (HEADED DESKTOP WINDOW)
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            PAUSED
          </span>
        );
      case 'stopped':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-900/60 text-red-300 border border-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            STOPPED
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            PASSED
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-900/60 text-rose-300 border border-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            IDLE / READY
          </span>
        );
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Execution State:</span>
          {getStatusBadge()}
        </div>
        {executionId && (
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            ID: {executionId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Run All / Launch */}
        {(!isRunning && !isPaused) && (
          <button
            onClick={onRunAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg shadow-md transition disabled:opacity-50"
            title="Execute test suite in a new headed desktop browser window"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Run All in Playwright (New Window)</span>
          </button>
        )}

        {/* Pause Button */}
        {isRunning && (
          <button
            onClick={onPause}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500 text-sm font-semibold rounded-lg transition"
            title="Pause execution cleanly between test cases"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Pause</span>
          </button>
        )}

        {/* Resume Button */}
        {isPaused && (
          <button
            onClick={onResume}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500 text-sm font-semibold rounded-lg transition animate-pulse"
            title="Resume execution from paused test case"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Resume</span>
          </button>
        )}

        {/* Stop Button */}
        {(isRunning || isPaused || isQueued) && (
          <button
            onClick={onStop}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500 text-sm font-semibold rounded-lg transition"
            title="Stop execution safely"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};
