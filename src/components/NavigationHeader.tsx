import React from 'react';
import { 
  Home, 
  BrainCircuit, 
  FileText, 
  Database, 
  Code2, 
  PlayCircle, 
  BarChart3, 
  Lock, 
  Sparkles,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export type TabId = 'home' | 'understanding' | 'test_cases' | 'synthetic_data' | 'playwright' | 'execution' | 'report';

interface NavigationHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isIntakeReady: boolean;
  isUnderstandingReady: boolean;
  runId?: string;
  onResetRun?: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  isIntakeReady,
  isUnderstandingReady,
  runId,
  onResetRun,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  const tabs = [
    { id: 'home' as TabId, label: 'Home', icon: Home, enabled: true, tooltip: 'Intake & Upload dashboard' },
    { id: 'understanding' as TabId, label: 'Understanding', icon: BrainCircuit, enabled: isIntakeReady, tooltip: isIntakeReady ? 'AI-First requirement & code analysis' : 'Upload docs or ZIP first to unblock' },
    { id: 'test_cases' as TabId, label: 'Test Cases', icon: FileText, enabled: false, tooltip: 'Phase 3: Gated placeholder (Requires Understanding)' },
    { id: 'synthetic_data' as TabId, label: 'Synthetic Data', icon: Database, enabled: false, tooltip: 'Phase 4: Gated placeholder (Requires Test Cases)' },
    { id: 'playwright' as TabId, label: 'Playwright Scripts', icon: Code2, enabled: false, tooltip: 'Phase 5: Gated placeholder (Requires Test Cases)' },
    { id: 'execution' as TabId, label: 'Execution', icon: PlayCircle, enabled: false, tooltip: 'Phase 6: Gated placeholder (Requires Scripts)' },
    { id: 'report' as TabId, label: 'Quality Report', icon: BarChart3, enabled: false, tooltip: 'Phase 7: Gated placeholder (Requires Execution)' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10.5px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-slate-100 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
                  QET Agent
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 tracking-wider">
                  Spec-Kit v1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">React-First AI Execution Engine</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={onZoomOut}
                title="Zoom out"
                className="rounded-md px-2 py-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-cyan-300"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={onZoomReset}
                title="Reset zoom"
                className="min-w-[56px] rounded-md px-2 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-cyan-300"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={onZoomIn}
                title="Zoom in"
                className="rounded-md px-2 py-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-cyan-300"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {runId && (
              <div className="flex items-center space-x-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Active Run:</span>
                <code className="text-xs font-mono font-semibold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {runId}
                </code>
                {onResetRun && (
                  <button
                    onClick={onResetRun}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium underline"
                  >
                    New Run
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none border-t border-slate-900 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isEnabled = tab.enabled;

            return (
              <button
                key={tab.id}
                onClick={() => isEnabled && onTabChange(tab.id)}
                disabled={!isEnabled}
                title={tab.tooltip}
                className={`
                  relative flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 text-cyan-300 border border-cyan-500/30 shadow-inner' 
                    : isEnabled 
                      ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60' 
                      : 'text-slate-600 cursor-not-allowed opacity-60 hover:opacity-75'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : isEnabled ? 'text-slate-400' : 'text-slate-600'}`} />
                <span>{tab.label}</span>
                
                {!isEnabled && (
                  <Lock className="w-3 h-3 text-slate-600 ml-1" />
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
