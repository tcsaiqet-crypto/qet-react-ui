import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, KeyRound, Save, Sparkles } from 'lucide-react';
import { AISettingsResponse, VerifyAISettingsResponse } from '../types';
import { ApiError, getAISettings, updateAISettings, verifyAISettings } from '../services/apiClient';

interface AISettingsPanelProps {
  onSaved?: (settings: AISettingsResponse) => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({ onSaved }) => {
  const [settings, setSettings] = useState<AISettingsResponse | null>(null);
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'gpt'>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [gptKey, setGptKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearGemini, setClearGemini] = useState(false);
  const [clearGpt, setClearGpt] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyAISettingsResponse | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAISettings();
      setSettings(data);
      setActiveProvider(data.active_provider);
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const clearProviderKeys: Array<'gemini' | 'gpt'> = [];
      if (clearGemini) clearProviderKeys.push('gemini');
      if (clearGpt) clearProviderKeys.push('gpt');

      const data = await updateAISettings({
        active_provider: activeProvider,
        provider_keys: {
          gemini: geminiKey,
          gpt: gptKey,
        },
        clear_provider_keys: clearProviderKeys,
      });
      setSettings(data);
      setGeminiKey('');
      setGptKey('');
      setClearGemini(false);
      setClearGpt(false);
      setMessage('AI settings saved. Invalid placeholder keys are blocked; you can also clear stored keys explicitly.');
      onSaved?.(data);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setMessage(null);
    try {
      const result = await verifyAISettings();
      setVerifyResult(result);
      setMessage('Verification finished. Review provider readiness and model visibility below.');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to verify provider keys.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="qet-panel p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Runtime AI Provider Control</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100">Switch AI and add provider keys without editing files</h3>
          <p className="text-sm text-slate-400 max-w-3xl">
            The backend already supports both Google Gemini and OpenAI GPT. Save a key here, pick the active provider, and future AI-required stages will use it.
          </p>
        </div>
        {settings && (
          <div className="qet-card px-4 py-3 text-xs space-y-1 min-w-[180px]">
            <div className="text-slate-500 uppercase tracking-wider font-semibold">Current Runtime</div>
            <div className="font-mono text-cyan-300">{settings.runtime_state.provider}</div>
            <div className="text-slate-400">
              Model: <span className="font-mono text-slate-200">{settings.runtime_state.model || 'Unavailable'}</span>
            </div>
            <div className={`font-semibold ${settings.runtime_state.state === 'Ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {settings.runtime_state.state}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading AI settings...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-5">
            <div className="qet-card p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active provider</label>
                <select
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value === 'gpt' ? 'gpt' : 'gemini')}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="gpt">OpenAI GPT</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gemini API key</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder={settings?.providers.gemini.key_present ? 'Stored key present' : 'Paste Gemini key'}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="text-xs text-slate-500">Status: {settings?.providers.gemini.key_present ? 'configured' : 'missing'}</div>
                  <label className="inline-flex items-center gap-2 text-xs text-rose-300">
                    <input
                      type="checkbox"
                      checked={clearGemini}
                      onChange={(e) => setClearGemini(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900"
                    />
                    Clear stored Gemini key on save
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OpenAI API key</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={gptKey}
                      onChange={(e) => setGptKey(e.target.value)}
                      placeholder={settings?.providers.gpt.key_present ? 'Stored key present' : 'Paste OpenAI key'}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="text-xs text-slate-500">Status: {settings?.providers.gpt.key_present ? 'configured' : 'missing'}</div>
                  <label className="inline-flex items-center gap-2 text-xs text-rose-300">
                    <input
                      type="checkbox"
                      checked={clearGpt}
                      onChange={(e) => setClearGpt(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900"
                    />
                    Clear stored OpenAI key on save
                  </label>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${saving ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 text-white hover:opacity-95 hover:scale-[1.01] shadow-lg shadow-cyan-500/20'}`}
              >
                {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving AI settings...' : 'Save AI Settings'}</span>
              </button>

              <button
                onClick={handleVerify}
                disabled={verifying}
                className={`ml-3 inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${verifying ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'qet-btn-secondary text-slate-100'}`}
              >
                {verifying ? <Sparkles className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                <span>{verifying ? 'Verifying...' : 'Verify Keys & Model Access'}</span>
              </button>
            </div>

            <div className="qet-card p-5 space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Supported right now</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                    <span>Google Gemini</span>
                    <span className="text-cyan-300">ready for model discovery</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                    <span>OpenAI GPT</span>
                    <span className="text-indigo-300">switchable fallback/primary</span>
                  </div>
                </div>
              </div>

              {settings?.gemini_candidate_models && settings.gemini_candidate_models.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini models visible to your key</div>
                  <div className="flex flex-wrap gap-2">
                    {settings.gemini_candidate_models.map((model) => (
                      <span key={model} className="text-xs font-mono px-2 py-1 rounded border border-slate-700 bg-slate-900 text-cyan-300">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 leading-relaxed">
                Adding providers beyond Gemini/OpenAI still needs backend code for that provider's API. This panel gives you runtime switching and key management for the providers already implemented today.
              </div>
            </div>
          </div>

          {message && <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{message}</div>}
          {error && <div className="rounded-lg border border-rose-800/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{error}</div>}

          {verifyResult && (
            <div className="qet-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Verification Result</p>
                  <p className="text-sm text-slate-300">Checked at {new Date(verifyResult.verified_at).toLocaleString()}</p>
                </div>
                <p className="text-xs text-slate-400">Active provider: <span className="font-mono text-cyan-300">{verifyResult.active_provider}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['gemini', 'gpt'] as const).map((provider) => {
                  const result = verifyResult.results[provider];
                  const ok = result?.success;
                  return (
                    <div key={provider} className={`rounded-lg border p-4 space-y-2 ${ok ? 'border-emerald-700/60 bg-emerald-950/20' : 'border-rose-700/60 bg-rose-950/20'}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-100">{provider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {ok ? 'Ready' : 'Action needed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Configured: <span className="font-mono text-slate-200">{result?.configured ? 'yes' : 'no'}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Model: <span className="font-mono text-cyan-300">{result?.model || 'Unavailable'}</span>
                      </p>
                      {!!result?.error_message && <p className="text-xs text-rose-300">{result.error_message}</p>}
                      {result?.candidates?.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {result.candidates.slice(0, 6).map((model) => (
                            <span key={model} className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-cyan-300">
                              {model}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
