import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, KeyRound, Save, Sparkles, RefreshCw } from 'lucide-react';
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
      setMessage('AI settings saved successfully.');
      onSaved?.(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings.');
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
      setMessage('Verification finished successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to verify AI provider keys.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="space-y-6 pb-12">
      <div className="qet-panel p-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold qet-badge-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Provider Runtime Configuration</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--qet-text-primary)' }}>
            AI Engine Settings
          </h2>
          <p className="text-xs" style={{ color: 'var(--qet-text-muted)' }}>
            Configure API keys for Google Gemini and OpenAI GPT. Antigravity discovers and ranks working model candidates automatically.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="qet-panel p-8 text-center text-xs" style={{ color: 'var(--qet-text-muted)' }}>
          Loading AI settings...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 qet-panel p-6 space-y-6">
              {/* Current Runtime Box */}
              {settings?.runtime_state && (
                <div className="qet-card-elevated p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                    Current Runtime
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Provider</span>
                      <p className="font-mono font-bold" style={{ color: 'var(--qet-text-primary)' }}>{settings.runtime_state.provider}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>State</span>
                      <p className="font-mono font-bold" style={{ color: 'var(--qet-accent)' }}>{settings.runtime_state.state}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Model:</span>
                      <p className="font-mono font-bold" style={{ color: 'var(--qet-accent)' }}>{settings.runtime_state.model || 'Unavailable'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--qet-text-muted)' }}>Key Present</span>
                      <p className="font-mono font-bold" style={{ color: settings.runtime_state.has_key ? 'var(--qet-success)' : 'var(--qet-danger)' }}>
                        {settings.runtime_state.has_key ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Provider Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                  Active Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['gemini', 'gpt'] as const).map((provider) => {
                    const isSelected = activeProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setActiveProvider(provider)}
                        className={`p-4 rounded-xl text-left border transition-all ${
                          isSelected ? 'qet-badge-accent shadow-sm ring-2 ring-blue-500/30' : 'qet-card-elevated'
                        }`}
                      >
                        <div className="text-sm font-bold capitalize">
                          {provider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--qet-text-muted)' }}>
                          {provider === 'gemini' ? 'Auto-discovery & fast multimodal' : 'Industry-standard reasoning models'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder={settings?.providers.gemini.key_present ? 'Stored key present' : 'Paste Gemini API key'}
                      className="w-full rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-colors border"
                      style={{
                        backgroundColor: 'var(--qet-surface)',
                        borderColor: 'var(--qet-border)',
                        color: 'var(--qet-text-primary)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>
                    <span>Status: {settings?.providers.gemini.key_present ? 'Configured' : 'Missing'}</span>
                    <label className="inline-flex items-center gap-1 text-rose-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearGemini}
                        onChange={(e) => setClearGemini(e.target.checked)}
                        className="rounded"
                      />
                      <span>Clear key</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--qet-text-muted)' }}>
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={gptKey}
                      onChange={(e) => setGptKey(e.target.value)}
                      placeholder={settings?.providers.gpt.key_present ? 'Stored key present' : 'Paste OpenAI key'}
                      className="w-full rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-colors border"
                      style={{
                        backgroundColor: 'var(--qet-surface)',
                        borderColor: 'var(--qet-border)',
                        color: 'var(--qet-text-primary)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--qet-text-muted)' }}>
                    <span>Status: {settings?.providers.gpt.key_present ? 'Configured' : 'Missing'}</span>
                    <label className="inline-flex items-center gap-1 text-rose-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearGpt}
                        onChange={(e) => setClearGpt(e.target.checked)}
                        className="rounded"
                      />
                      <span>Clear key</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="qet-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
                >
                  {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="qet-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  <span>{verifying ? 'Verifying...' : 'Verify Keys & Model Access'}</span>
                </button>
              </div>
            </div>

            {/* Side Card: Supported Models */}
            <div className="qet-panel p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--qet-text-muted)' }}>
                  Supported Providers
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg qet-card-elevated">
                    <span className="font-semibold" style={{ color: 'var(--qet-text-primary)' }}>Google Gemini</span>
                    <span className="qet-badge-accent px-2 py-0.5 text-[10px]">Model discovery ready</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg qet-card-elevated">
                    <span className="font-semibold" style={{ color: 'var(--qet-text-primary)' }}>OpenAI GPT</span>
                    <span className="qet-badge-neutral px-2 py-0.5 text-[10px]">Fallback / Primary</span>
                  </div>
                </div>
              </div>

              {settings?.gemini_candidate_models && settings.gemini_candidate_models.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--qet-text-muted)' }}>
                    Gemini models visible to your key
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {settings.gemini_candidate_models.map((model) => (
                      <span key={model} className="qet-badge-accent text-[11px] font-mono px-2 py-0.5">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Messages */}
          {message && <div className="qet-badge-success p-4 text-xs font-semibold">{message}</div>}
          {error && <div className="qet-badge-danger p-4 text-xs font-semibold">{error}</div>}

          {/* Verification Results */}
          {verifyResult && (
            <div className="qet-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--qet-text-muted)' }}>
                    Verification Result
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--qet-text-secondary)' }}>
                    Checked at {new Date(verifyResult.verified_at).toLocaleTimeString()}
                  </p>
                </div>
                <span className="qet-badge-accent px-2.5 py-1 text-xs font-mono font-bold">
                  Active: {verifyResult.active_provider}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['gemini', 'gpt'] as const).map((provider) => {
                  const result = verifyResult.results[provider];
                  const ok = result?.success;
                  return (
                    <div
                      key={provider}
                      className={`p-4 rounded-xl border space-y-2 ${ok ? 'qet-badge-success' : 'qet-badge-danger'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{provider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold">
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{ok ? 'Ready' : 'Action needed'}</span>
                        </span>
                      </div>
                      <p className="text-xs">
                        Configured: <span className="font-mono font-bold">{result?.configured ? 'yes' : 'no'}</span>
                      </p>
                      <p className="text-xs">
                        Model: <span className="font-mono font-bold">{result?.model || 'Unavailable'}</span>
                      </p>
                      {!!result?.error_message && <p className="text-xs font-semibold">{result.error_message}</p>}
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
