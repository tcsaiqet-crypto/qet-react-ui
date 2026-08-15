import React from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Home,
  Settings2,
  FolderKanban,
  Sparkles,
} from 'lucide-react';

export type TabId = 'home' | 'execution' | 'runs' | 'tools';

interface NavigationHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapsed,
}) => {
  const tabs = [
    { id: 'home' as TabId, label: 'Home', icon: Home, tooltip: 'Intake, uploads and understanding flow' },
    { id: 'runs' as TabId, label: 'Runs', icon: FolderKanban, tooltip: 'Previous run dashboard' },
    { id: 'tools' as TabId, label: 'Tools', icon: Settings2, tooltip: 'AI provider and key settings' },
  ];

  return (
    <aside className={`sticky top-0 h-screen border-r border-slate-800 bg-slate-950/95 backdrop-blur-md text-slate-100 transition-all ${collapsed ? 'w-[84px]' : 'w-[260px]'}`}>
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10.5px] bg-slate-950">
                <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            {!collapsed && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-slate-100 via-cyan-200 to-indigo-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">QET Agent</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">React-First AI Execution Engine</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapsed}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 transition-colors hover:border-cyan-700 hover:text-cyan-300"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.tooltip}
                className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${collapsed ? 'justify-center' : ''} ${isActive ? 'border-cyan-600/60 bg-cyan-950/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-slate-100'}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!collapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
            Keep Home focused on uploads and understanding. Use Runs for history and Tools for AI/provider setup.
          </div>
        )}
      </div>
    </aside>
  );
};
