import React, { useEffect, useState } from 'react';
import { Cpu, KeyRound, Save, Sparkles } from 'lucide-react';
import { AISettingsResponse } from '../types';
import { ApiError, getAISettings, updateAISettings } from '../services/apiClient';

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
      const data = await updateAISettings({
        active_provider: activeProvider,
        provider_keys: {
          gemini: geminiKey,
          gpt: gptKey,
        },
      });
      setSettings(data);
      setGeminiKey('');
      setGptKey('');
      setMessage('AI settings saved. New runs and retries will use the selected provider.');
      onSaved?.(data);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl bg-slate-900/75 border border-slate-800 shadow-xl p-6 space-y-5 animate-fade-in">
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
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs space-y-1 min-w-[180px]">
            <div className="text-slate-500 uppercase tracking-wider font-semibold">Current Runtime</div>
            <div className="font-mono text-cyan-300">{settings.runtime_state.provider}</div>
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
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 space-y-4">
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
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 space-y-4">
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
        </>
      )}
    </section>
  );
};
