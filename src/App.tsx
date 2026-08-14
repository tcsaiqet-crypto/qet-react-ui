import React, { useState, useEffect } from 'react';
import { NavigationHeader, TabId } from './components/NavigationHeader';
import { HomeUploadPage } from './components/HomeUploadPage';
import { UnderstandingPage } from './components/UnderstandingPage';
import { AppState } from './types';
import { createRun, getRunStatus } from './services/apiClient';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initRun();
  }, []);

  useEffect(() => {
    if (!appState?.run_id) return;

    // Poll status periodically when active
    const activeStates = ['uploading', 'processing_zip', 'indexing', 'ai_understanding_running'];
    if (activeStates.includes(appState.status)) {
      const timer = setInterval(() => {
        refreshStatus(appState.run_id);
      }, 2500);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [appState?.run_id, appState?.status]);

  const initRun = async () => {
    setLoading(true);
    try {
      const res = await createRun('CFA Digital Journey');
      setAppState(res.state);
    } catch (err) {
      console.error('Run init failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (runId?: string) => {
    const targetId = runId || appState?.run_id;
    if (!targetId) return;
    try {
      const res = await getRunStatus(targetId);
      setAppState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: res.state,
          progress: res.progress,
          last_error: res.error,
          intake_manifest: res.intake_manifest || prev.intake_manifest,
          stage_timestamps: res.stage_timestamps || prev.stage_timestamps,
        };
      });
    } catch (err) {
      console.error('Failed to poll status:', err);
    }
  };

  const isIntakeReady = Boolean(
    appState?.intake_manifest && 
    (appState.intake_manifest.total_files > 0 || (appState.intake_manifest.doc_files && appState.intake_manifest.doc_files.length > 0))
  );

  const isUnderstandingReady = Boolean(appState?.understanding || appState?.status === 'understanding_ready');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white">
      
      {/* Navigation Header */}
      <NavigationHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isIntakeReady={isIntakeReady}
        isUnderstandingReady={isUnderstandingReady}
        runId={appState?.run_id}
        onResetRun={initRun}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Initializing QET Agent Workspace...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeUploadPage
                appState={appState}
                onRefreshStatus={() => refreshStatus()}
                onProceedToUnderstanding={() => setActiveTab('understanding')}
                onCreateNewRun={initRun}
              />
            )}

            {activeTab === 'understanding' && (
              <UnderstandingPage
                appState={appState}
                onRefreshStatus={() => refreshStatus()}
              />
            )}

            {/* Placeholder screens for gated downstream tabs */}
            {!['home', 'understanding'].includes(activeTab) && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-16 text-center space-y-4 max-w-xl mx-auto my-12">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                  <span className="text-xl">🔒</span>
                </div>
                <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wide">
                  {activeTab.replace('_', ' ')} Phase Gated
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This phase is a placeholder reserved for subsequent spec increments. Complete the Home intake and AI Understanding phase first to unlock downstream test generation.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/60 px-4 py-2 rounded-lg border border-cyan-800/60 transition-colors"
                >
                  <span>Return to Home Dashboard</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>QET AI Execution Engine &bull; React-First Spec-Kit Delivery &bull; Antigravity Platform</p>
      </footer>
    </div>
  );
};
