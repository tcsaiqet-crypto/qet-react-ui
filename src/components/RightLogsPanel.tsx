import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, 
  Download, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  X,
  Maximize2,
  GripVertical
} from 'lucide-react';
import { LogEntry } from './ConsoleLogDrawer';

interface RightLogsPanelProps {
  frontendLogs: LogEntry[];
  backendLogs: string;
  onClearFrontend: () => void;
  onDownloadFrontend: () => void;
  onDownloadBackend: () => void;
  activeProvider: string;
  activeModel: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const RightLogsPanel: React.FC<RightLogsPanelProps> = ({
  frontendLogs,
  backendLogs,
  onClearFrontend,
  onDownloadFrontend,
  onDownloadBackend,
  activeProvider,
  activeModel,
  isOpen = true,
  onToggle,
}) => {
  const [logType, setLogType] = useState<'backend' | 'frontend'>('backend');
  const [filter, setFilter] = useState<'all' | 'info' | 'status' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [panelWidth, setPanelWidth] = useState(384); // default w-96 = 384px
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(384);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX; // drag left = wider
      const newWidth = Math.max(280, Math.min(700, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  }, [panelWidth]);

  const getBackendLineType = (line: string): 'info' | 'status' | 'error' | 'warn' => {
    if (line.includes('[ERROR]') || line.includes('Traceback') || line.includes('Exception:') || line.includes('401') || line.includes('404')) {
      return 'error';
    } else if (line.includes('[WARNING]') || line.includes('[WARN]') || line.includes('429') || line.includes('503')) {
      return 'warn';
    } else if (line.includes('[STATUS]') || line.includes('[SYSTEM]') || line.includes('Initiating') || line.includes('completed') || line.includes('PASSED') || line.includes('ready')) {
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
        if (filter === 'status') {
          const lower = entry.message.toLowerCase();
          return lower.includes('status') || lower.includes('ready') || lower.includes('completed') || lower.includes('start');
        }
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
  }, [frontendLogs, backendLogs, logType, autoScroll, filter, searchTerm, isOpen]);

  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const getLogIcon = (type: 'info' | 'warn' | 'error') => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
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
            <mark key={i} className="bg-amber-300 dark:bg-amber-800 text-slate-900 dark:text-white font-bold px-0.5 rounded-xs">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // If collapsed, render minimal vertical pill rail
  if (!isOpen) {
    return (
      <aside 
        onClick={onToggle}
        title="Expand Console Logs"
        aria-label="Collapsed Console Logs"
        className="w-12 shrink-0 cursor-pointer rounded-2xl border shadow-sm transition-all duration-300 flex flex-col items-center py-4 gap-4 select-none hover:shadow-md hover:border-sky-500/50"
        style={{
          backgroundColor: 'var(--qet-surface)',
          borderColor: 'var(--qet-border)',
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--qet-accent)' }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--qet-surface-elevated)' }}>
          <Terminal className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
        </div>

        <div 
          className="text-xs font-bold tracking-wider uppercase [writing-mode:vertical-rl] rotate-180 py-2"
          style={{ color: 'var(--qet-text-muted)' }}
        >
          Console Logs
        </div>

        <span 
          className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
          style={{ backgroundColor: 'var(--qet-accent-subtle)', color: 'var(--qet-accent)' }}
        >
          {filteredLogs.length}
        </span>
      </aside>
    );
  }

  return (
    <aside 
      className="shrink-0 lg:sticky lg:top-20 flex flex-col h-[calc(100vh-140px)] relative"
      style={{ width: panelWidth }}
      aria-label="Console Logs & Diagnostics"
    >
      {/* Drag resize handle on left edge */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-sky-500/40 transition-colors rounded-l-sm group flex items-center justify-center"
        title="Drag to resize panel"
      >
        <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--qet-accent)' }} />
      </div>
      <div 
        className="flex flex-col h-full rounded-2xl border shadow-md overflow-hidden ml-1.5"
        style={{
          backgroundColor: 'var(--qet-surface)',
          borderColor: 'var(--qet-border)',
        }}
      >
        {/* Panel Top Header */}
        <div 
          className="flex items-center justify-between px-3.5 py-2.5 border-b"
          style={{
            backgroundColor: 'var(--qet-surface-elevated)',
            borderColor: 'var(--qet-border)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-4 w-4" style={{ color: 'var(--qet-accent)' }} />
            <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--qet-text-primary)' }}>
              Live Console Logs
            </span>
            <span 
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--qet-accent-subtle)', color: 'var(--qet-accent)' }}
            >
              {activeProvider}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={logType === 'backend' ? onDownloadBackend : onDownloadFrontend}
              title="Download Logs as TXT"
              className="p-1 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
              style={{ color: 'var(--qet-text-secondary)' }}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {logType === 'frontend' && (
              <button
                type="button"
                onClick={onClearFrontend}
                title="Clear Logs"
                className="p-1 rounded hover:text-rose-500 transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: 'var(--qet-text-secondary)' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                title="Collapse Panel"
                className="p-1 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ml-1"
                style={{ color: 'var(--qet-text-secondary)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher: Backend / Frontend */}
        <div 
          className="flex items-center border-b px-3 py-1.5 gap-2"
          style={{
            backgroundColor: 'var(--qet-surface)',
            borderColor: 'var(--qet-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setLogType('backend')}
            className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all cursor-pointer ${
              logType === 'backend' ? 'qet-btn-primary shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Backend (Python)
          </button>
          <button
            type="button"
            onClick={() => setLogType('frontend')}
            className={`flex-1 rounded-md py-1 text-xs font-semibold transition-all cursor-pointer ${
              logType === 'frontend' ? 'qet-btn-primary shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Frontend (UI)
          </button>
        </div>

        {/* Filter Buttons & Search Box */}
        <div 
          className="flex flex-col gap-2 p-2.5 border-b"
          style={{
            backgroundColor: 'var(--qet-surface-elevated)',
            borderColor: 'var(--qet-border)',
          }}
        >
          <div className="flex items-center gap-1">
            {(['all', 'info', 'status', 'error'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                className={`flex-1 rounded py-0.5 text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                  filter === level
                    ? 'qet-badge-accent font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs with highlighting..."
              className="w-full rounded-md border pl-7 pr-2 py-1 text-[11px] outline-none transition-all focus:border-sky-500"
              style={{
                backgroundColor: 'var(--qet-surface)',
                borderColor: 'var(--qet-border)',
                color: 'var(--qet-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Monospace Log Stream Body */}
        <div 
          ref={logContainerRef} 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1 select-text"
          style={{ backgroundColor: 'var(--qet-page-bg)' }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-xs italic" style={{ color: 'var(--qet-text-muted)' }}>
              <Terminal className="h-6 w-6 mb-2 opacity-40" />
              <span>No logs found for selected filter.</span>
            </div>
          ) : (
            filteredLogs.map((item, idx) => {
              if (logType === 'frontend') {
                const entry = item as LogEntry;
                return (
                  <div
                    key={idx}
                    id={`log-line-${idx}`}
                    className="flex items-start gap-2 py-0.5 border-b border-dashed"
                    style={{ borderColor: 'var(--qet-border)' }}
                  >
                    <span className="text-slate-400 select-none">[{entry.timestamp}]</span>
                    {getLogIcon(entry.type)}
                    <span
                      className={`whitespace-pre-wrap ${
                        entry.type === 'error'
                          ? 'text-rose-500 font-semibold'
                          : entry.type === 'warn'
                          ? 'text-amber-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {highlightText(entry.message, searchTerm)}
                    </span>
                  </div>
                );
              } else {
                const line = item as string;
                const lineType = getBackendLineType(line);

                let colorClass = 'text-slate-700 dark:text-slate-300';
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
                    className={`whitespace-pre-wrap font-mono py-0.5 border-b border-dashed ${colorClass}`}
                    style={{ borderColor: 'var(--qet-border)' }}
                  >
                    {highlightText(line, searchTerm)}
                  </div>
                );
              }
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Footer Info Bar */}
        <div 
          className="flex items-center justify-between px-3 py-1.5 border-t text-[10px]"
          style={{
            backgroundColor: 'var(--qet-surface-elevated)',
            borderColor: 'var(--qet-border)',
            color: 'var(--qet-text-muted)',
          }}
        >
          <span>{filteredLogs.length} lines</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded accent-sky-600 h-3 w-3"
            />
            <span>Auto-Scroll</span>
          </label>
        </div>
      </div>
    </aside>
  );
};
