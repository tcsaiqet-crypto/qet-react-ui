import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Trash2, AlertTriangle, AlertCircle, Info, Search, ShieldCheck } from 'lucide-react';
import { LogEntry } from './ConsoleLogDrawer';

interface RightLogsPanelProps {
  frontendLogs: LogEntry[];
  backendLogs: string;
  onClearFrontend: () => void;
  onDownloadFrontend: () => void;
  onDownloadBackend: () => void;
  activeProvider: string;
  activeModel: string;
}

export const RightLogsPanel: React.FC<RightLogsPanelProps> = ({
  frontendLogs,
  backendLogs,
  onClearFrontend,
  onDownloadFrontend,
  onDownloadBackend,
  activeProvider,
  activeModel,
}) => {
  const [logType, setLogType] = useState<'backend' | 'frontend'>('backend');
  const [filter, setFilter] = useState<'all' | 'info' | 'status' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const getBackendLineType = (line: string): 'info' | 'status' | 'error' | 'warn' => {
    if (line.includes('[ERROR]') || line.includes('Traceback') || line.includes('Exception:') || line.includes('401') || line.includes('404')) {
      return 'error';
    } else if (line.includes('[WARNING]') || line.includes('[WARN]') || line.includes('429') || line.includes('503')) {
      return 'warn';
    } else if (line.includes('[STATUS]') || line.includes('[SYSTEM]') || line.includes('Initiating') || line.includes('completed') || line.includes('PASSED')) {
      return 'status';
    }
    return 'info';
  };

  const getFilteredLogs = () => {
    if (logType === 'frontend') {
      return frontendLogs.filter((entry) => {
        if (filter === 'all') return true;
        if (filter === 'error') return entry.type === 'error' || entry.type === 'warn';
        if (filter === 'info') return entry.type === 'info';
        if (filter === 'status') return entry.message.toLowerCase().includes('status') || entry.message.toLowerCase().includes('ready');
        return true;
      });
    } else {
      const lines = backendLogs.split('\n');
      if (lines.length > 0 && !lines[lines.length - 1].trim()) {
        lines.pop();
      }
      return lines.filter((line) => {
        if (filter === 'all') return true;
        const type = getBackendLineType(line);
        if (filter === 'error') return type === 'error' || type === 'warn';
        if (filter === 'status') return type === 'status';
        if (filter === 'info') return type === 'info';
        return true;
      });
    }
  };

  const filteredLogs = getFilteredLogs();

  useEffect(() => {
    if (autoScroll && logEndRef.current && searchTerm.trim() === '') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [frontendLogs, backendLogs, logType, autoScroll, filter, searchTerm]);

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-slate-900 font-bold px-1 rounded-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-96 flex flex-col h-[calc(100vh-140px)]" aria-label="Console Logs & Diagnostics">
      <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 shadow-md overflow-hidden dark:border-slate-800">
        {/* Panel Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold text-white tracking-wide">Live Console Logs</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
              {activeProvider}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={logType === 'backend' ? onDownloadBackend : onDownloadFrontend}
              title="Download Logs as TXT"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {logType === 'frontend' && (
              <button
                type="button"
                onClick={onClearFrontend}
                title="Clear Logs"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher: Backend / Frontend */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 gap-2">
          <button
            type="button"
            onClick={() => setLogType('backend')}
            className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all ${
              logType === 'backend' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Backend (Python)
          </button>
          <button
            type="button"
            onClick={() => setLogType('frontend')}
            className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all ${
              logType === 'frontend' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frontend (UI)
          </button>
        </div>

        {/* Filter Pills & Search Box */}
        <div className="flex flex-col gap-2 p-2.5 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-1">
            {(['all', 'info', 'status', 'error'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                className={`flex-1 rounded py-0.5 text-[10px] font-semibold capitalize transition-all ${
                  filter === level
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-2 h-3 w-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs with highlighting..."
              className="w-full rounded-md bg-slate-900 border border-slate-800 pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Monospace Log Content */}
        <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1 bg-slate-950/80">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
              <Terminal className="h-6 w-6 mb-2 opacity-40" />
              <span>No logs found for selected filter.</span>
            </div>
          ) : (
            filteredLogs.map((item, idx) => {
              const text = typeof item === 'string' ? item : `[${item.timestamp}] [${item.type.toUpperCase()}] ${item.message}`;
              const lineType = typeof item === 'string' ? getBackendLineType(item) : item.type;

              let colorClass = 'text-slate-300';
              if (lineType === 'error') colorClass = 'text-rose-400 font-semibold';
              else if (lineType === 'warn') colorClass = 'text-amber-300';
              else if (lineType === 'status') colorClass = 'text-emerald-300';

              return (
                <div key={idx} className={`break-words ${colorClass}`}>
                  {highlightText(text, searchTerm)}
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400">
          <span>{filteredLogs.length} lines</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded accent-blue-600 h-3 w-3"
            />
            <span>Auto-Scroll</span>
          </label>
        </div>
      </div>
    </aside>
  );
};
