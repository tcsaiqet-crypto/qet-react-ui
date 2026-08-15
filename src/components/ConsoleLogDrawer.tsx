import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, Download, Trash2, X, AlertTriangle, AlertCircle, Info, Search } from 'lucide-react';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error';
}

interface ConsoleLogDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  frontendLogs: LogEntry[];
  backendLogs: string;
  onClearFrontend: () => void;
  onDownloadFrontend: () => void;
  onDownloadBackend: () => void;
  activeProvider: string;
  activeModel: string;
}

export const ConsoleLogDrawer: React.FC<ConsoleLogDrawerProps> = ({
  isOpen,
  onToggle,
  frontendLogs,
  backendLogs,
  onClearFrontend,
  onDownloadFrontend,
  onDownloadBackend,
  activeProvider,
  activeModel,
}) => {
  const [logType, setLogType] = useState<'frontend' | 'backend'>('frontend');
  const [filter, setFilter] = useState<'all' | 'info' | 'status' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Helper to classify backend line type
  const getBackendLineType = (line: string): 'info' | 'status' | 'error' | 'warn' => {
    if (line.includes('[ERROR]') || line.includes('Traceback') || line.includes('Exception:')) {
      return 'error';
    } else if (line.includes('[WARNING]') || line.includes('[WARN]')) {
      return 'warn';
    } else if (line.includes('[SYSTEM]') || line.includes('Initiating') || line.includes('successfully') || line.includes('completed')) {
      return 'status';
    }
    return 'info';
  };

  // Process logs according to type and filter
  const getFilteredLogs = () => {
    if (logType === 'frontend') {
      return frontendLogs.filter((entry) => {
        if (filter === 'all') return true;
        if (filter === 'error') return entry.type === 'error' || entry.type === 'warn';
        if (filter === 'info') return entry.type === 'info';
        if (filter === 'status') {
          const lowerMsg = entry.message.toLowerCase();
          return (
            lowerMsg.includes('status') ||
            lowerMsg.includes('navigated') ||
            lowerMsg.includes('loaded') ||
            lowerMsg.includes('created') ||
            lowerMsg.includes('updated') ||
            lowerMsg.includes('initialized') ||
            lowerMsg.includes('success')
          );
        }
        return true;
      });
    } else {
      const lines = backendLogs.split('\n');
      if (lines.length > 0 && !lines[lines.length - 1].trim()) {
        lines.pop(); // remove trailing empty line
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

  // Scroll to bottom if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalEndRef.current && searchTerm.trim() === '') {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [frontendLogs, backendLogs, isOpen, logType, autoScroll, filter, searchTerm]);

  // Handle scroll events to detect if the user manually scrolled up
  const handleScroll = () => {
    if (!terminalBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalBodyRef.current;
    // If user is within 30px of the bottom, enable autoScroll, otherwise disable it
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
  };

  // Search auto-scroller
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      const firstMatchIdx = filteredLogs.findIndex((log) => {
        const text = typeof log === 'string' ? log : log.message;
        return text.toLowerCase().includes(lowerSearch);
      });
      if (firstMatchIdx !== -1) {
        const el = document.getElementById(`log-line-${firstMatchIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [searchTerm, filter, logType, filteredLogs.length]);

  const getLogIcon = (type: 'info' | 'warn' | 'error') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 animate-pulse" />;
      case 'warn':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-3.5 w-3.5 text-sky-500 shrink-0" />;
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-800/80 text-black dark:text-white rounded-xs px-0.5 font-semibold">
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
    <div
      className={`w-full mt-6 border shadow-sm rounded-xl transition-all duration-300 overflow-hidden ${
        isOpen ? 'h-96' : 'h-11'
      }`}
      style={{
        backgroundColor: 'var(--qet-surface)',
        borderColor: 'var(--qet-border)',
      }}
    >
      {/* Drawer Header (Toggable Bar) */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b cursor-pointer select-none transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--qet-border)' }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="h-4.5 w-4.5" style={{ color: 'var(--qet-accent)' }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--qet-text-primary)' }}>
            Console Logs
          </span>
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono leading-none"
            style={{ backgroundColor: 'var(--qet-accent-subtle)', color: 'var(--qet-accent)' }}
          >
            {activeProvider} ({activeModel})
          </span>
          {isOpen && (
            <span className="text-[10px]" style={{ color: 'var(--qet-text-muted)' }}>
              ({filteredLogs.length} shown)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isOpen ? (
            <>
              {/* Search input */}
              <div className="relative flex items-center">
                <Search className="absolute left-2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="rounded-md border pl-7 pr-2 py-0.5 text-[11px] outline-none transition-all w-28 focus:w-44 focus:border-sky-500"
                  style={{
                    backgroundColor: 'var(--qet-surface-elevated)',
                    borderColor: 'var(--qet-border)',
                    color: 'var(--qet-text-primary)',
                  }}
                />
              </div>

              {/* Dropdown to switch filter level */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="rounded-md border px-2 py-0.5 text-[11px] font-semibold cursor-pointer outline-none transition-all"
                style={{
                  backgroundColor: 'var(--qet-surface-elevated)',
                  borderColor: 'var(--qet-border)',
                  color: 'var(--qet-text-primary)',
                }}
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="status">Status</option>
                <option value="error">Error</option>
              </select>

              {/* Dropdown to switch log type */}
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value as 'frontend' | 'backend')}
                className="rounded-md border px-2 py-0.5 text-[11px] font-semibold cursor-pointer outline-none transition-all"
                style={{
                  backgroundColor: 'var(--qet-surface-elevated)',
                  borderColor: 'var(--qet-border)',
                  color: 'var(--qet-text-primary)',
                }}
              >
                <option value="frontend">Frontend UI Logs</option>
                <option value="backend">Backend Logs</option>
              </select>

              {/* Action Buttons */}
              {logType === 'frontend' ? (
                <>
                  <button
                    onClick={onClearFrontend}
                    title="Clear Frontend Console"
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--qet-text-secondary)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={onDownloadFrontend}
                    title="Download Frontend Logs"
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--qet-text-secondary)' }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onDownloadBackend}
                  title="Download Backend Execution Logs"
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                  style={{ color: 'var(--qet-text-secondary)' }}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ml-1 cursor-pointer"
                style={{ color: 'var(--qet-text-secondary)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button className="p-0.5 rounded cursor-pointer" style={{ color: 'var(--qet-text-secondary)' }}>
              <ChevronUp className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drawer Body (Terminal Area) */}
      {isOpen && (
        <div
          ref={terminalBodyRef}
          onScroll={handleScroll}
          className="h-[320px] overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed select-text"
          style={{ backgroundColor: 'var(--qet-page-bg)' }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500 italic py-2">No matching logs found.</div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log, idx) => {
                if (logType === 'frontend') {
                  const entry = log as LogEntry;
                  return (
                    <div
                      key={idx}
                      id={`log-line-${idx}`}
                      className="flex items-start gap-2 py-0.5 border-b border-dashed border-slate-500/10"
                    >
                      <span className="text-slate-500 select-none">[{entry.timestamp}]</span>
                      {getLogIcon(entry.type)}
                      <span
                        className={`whitespace-pre-wrap ${
                          entry.type === 'error'
                            ? 'text-rose-400 font-semibold'
                            : entry.type === 'warn'
                            ? 'text-amber-400'
                            : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                      >
                        {highlightText(entry.message, searchTerm)}
                      </span>
                    </div>
                  );
                } else {
                  const line = log as string;
                  const lineType = getBackendLineType(line);

                  let colorClass = 'text-slate-600 dark:text-slate-300';
                  if (lineType === 'error') {
                    colorClass = 'text-rose-600 dark:text-rose-400 font-semibold';
                  } else if (lineType === 'warn') {
                    colorClass = 'text-amber-600 dark:text-amber-400';
                  } else if (lineType === 'status') {
                    colorClass = 'text-teal-600 dark:text-teal-400 font-semibold';
                  }

                  return (
                    <div
                      key={idx}
                      id={`log-line-${idx}`}
                      className={`whitespace-pre-wrap font-mono py-0.5 border-b border-dashed border-slate-500/10 ${colorClass}`}
                    >
                      {highlightText(line, searchTerm)}
                    </div>
                  );
                }
              })}
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
};
