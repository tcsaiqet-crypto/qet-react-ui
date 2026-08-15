import React, { useEffect, useState } from 'react';
import { Ban, CheckCircle2, Loader2, Play, Square, Terminal } from 'lucide-react';
import { AppState, ExecutionStatusResponse } from '../types';
import { ApiError, cancelExecution, getExecutionStatus, launchExecution } from '../services/apiClient';

interface ExecutionPageProps { appState: AppState | null; }

export const ExecutionPage: React.FC<ExecutionPageProps> = ({ appState }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nonProduction, setNonProduction] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [execution, setExecution] = useState<ExecutionStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cases = appState?.test_suite?.test_cases || [];
  const running = execution?.status === 'queued' || execution?.status === 'running';

  useEffect(() => {
    if (!appState?.run_id || !execution || !running) return;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';
    const websocketUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${baseUrl}/runs/${appState.run_id}/executions/${execution.execution_id}/events`;
    const socket = new WebSocket(websocketUrl);
    socket.onmessage = (event) => setExecution(JSON.parse(event.data) as ExecutionStatusResponse);
    socket.onerror = () => setError('Live execution connection failed; status polling will continue.');
    const timer = window.setInterval(() => void getExecutionStatus(appState.run_id, execution.execution_id).then(setExecution).catch(() => undefined), 1000);
    return () => { socket.close(); window.clearInterval(timer); };
  }, [appState?.run_id, execution?.execution_id, running]);

  const toggleCase = (caseId: string) => setSelectedIds((current) => current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]);
  const selectAll = () => setSelectedIds(selectedIds.length === cases.length ? [] : cases.map((testCase) => testCase.case_id));
  const launch = async () => {
    if (!appState?.run_id) return;
    setError(null);
    try {
      setExecution(await launchExecution(appState.run_id, { test_case_ids: selectedIds, explicit_user_approval: approved, is_non_production_confirmed: nonProduction, is_script_reviewed: reviewed }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not launch execution.');
    }
  };
  const cancel = async () => {
    if (!appState?.run_id || !execution) return;
    setExecution(await cancelExecution(appState.run_id, execution.execution_id));
  };

  return <section className="space-y-5" aria-label="Execution workspace">
    <div className="qet-panel p-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><h2 className="text-xl font-bold" style={{ color: 'var(--qet-text-primary)' }}>Test Execution</h2><p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>Select generated cases, approve a non-production run, and follow the active case live.</p></div>
      <span className="qet-badge-neutral px-3 py-1 text-xs font-mono">{selectedIds.length} selected</span>
    </div>
    {!cases.length ? <div className="qet-panel p-6 text-sm" style={{ color: 'var(--qet-text-muted)' }}>Generate test cases and Playwright scripts for this run before launching execution.</div> : <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="qet-panel p-5 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Generated Test Cases</h3><button className="qet-btn-secondary px-2.5 py-1 text-xs" onClick={selectAll}>{selectedIds.length === cases.length ? 'Clear all' : 'Select all'}</button></div>
        {cases.map((testCase) => <label key={testCase.case_id} className="flex gap-3 border-t py-3 cursor-pointer" style={{ borderColor: 'var(--qet-border)' }}><input type="checkbox" checked={selectedIds.includes(testCase.case_id)} onChange={() => toggleCase(testCase.case_id)} /><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="font-mono text-xs font-bold">{testCase.case_id}</span><span className="text-xs">{testCase.title}</span></div><p className="mt-1 text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>{testCase.case_type} · {testCase.priority} · {testCase.feature_area}</p></div></label>)}</div>
      <div className="space-y-5"><div className="qet-panel p-5 space-y-3"><h3 className="text-sm font-bold">Execution Approval</h3>{[[nonProduction, setNonProduction, 'I confirm the target is non-production.'], [reviewed, setReviewed, 'I reviewed the generated Playwright scripts.'], [approved, setApproved, 'I explicitly approve this browser execution.']].map(([checked, setter, label]) => <label key={String(label)} className="flex gap-2 text-xs"><input type="checkbox" checked={checked as boolean} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<boolean>>)(event.target.checked)} />{label as string}</label>)}<button disabled={!selectedIds.length || !nonProduction || !reviewed || !approved || running} onClick={launch} className="qet-btn-primary w-full flex items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-50"><Play className="h-4 w-4" />Launch selected tests</button></div>
        <div className="qet-panel p-5 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Active Execution</h3>{execution && <span className="qet-badge-accent px-2 py-1 text-[10px] uppercase">{execution.status}</span>}</div>{execution ? <><div className="text-sm font-semibold">{execution.current_test_case_id || execution.selected_test_case_ids[0]}</div><div className="text-xs italic" style={{ color: 'var(--qet-text-muted)' }}>{execution.current_step || 'Waiting for worker'}</div>{running && <button onClick={cancel} className="qet-btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"><Square className="h-3.5 w-3.5" />Cancel</button>}<div className="max-h-40 overflow-auto rounded-lg p-3 font-mono text-[10px]" style={{ backgroundColor: 'var(--qet-surface-elevated)' }}>{execution.logs.map((log, index) => <div key={index}>{log}</div>)}</div>{execution.result && <div className="text-xs"><CheckCircle2 className="inline h-4 w-4 text-emerald-500 mr-1" />Passed {execution.result.passed_count} · Failed {execution.result.failed_count}</div>}</> : <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--qet-text-muted)' }}><Terminal className="h-4 w-4" />No execution launched.</div>}</div></div>
    </div>}
    {error && <div className="qet-badge-danger p-3 text-xs flex gap-2"><Ban className="h-4 w-4" />{error}</div>}
  </section>;
};