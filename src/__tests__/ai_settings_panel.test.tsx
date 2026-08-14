import { describe, expect, test, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AISettingsPanel } from '../components/AISettingsPanel';

const getAISettings = vi.fn();
const updateAISettings = vi.fn();
const verifyAISettings = vi.fn();

vi.mock('../services/apiClient', () => ({
  ApiError: class ApiError extends Error {},
  getAISettings: (...args: unknown[]) => getAISettings(...args),
  updateAISettings: (...args: unknown[]) => updateAISettings(...args),
  verifyAISettings: (...args: unknown[]) => verifyAISettings(...args),
}));

describe('AISettingsPanel', () => {
  beforeEach(() => {
    getAISettings.mockResolvedValue({
      active_provider: 'gemini',
      llm_enabled: true,
      providers: {
        gemini: { key_present: true, display_name: 'Google Gemini' },
        gpt: { key_present: false, display_name: 'OpenAI GPT' },
      },
      runtime_state: {
        provider: 'gemini',
        enabled: true,
        has_key: true,
        state: 'Ready',
        model: 'gemini-2.5-flash',
      },
      gemini_candidate_models: ['gemini-2.5-flash'],
    });
    updateAISettings.mockResolvedValue({
      active_provider: 'gemini',
      llm_enabled: true,
      providers: {
        gemini: { key_present: true, display_name: 'Google Gemini' },
        gpt: { key_present: false, display_name: 'OpenAI GPT' },
      },
      runtime_state: {
        provider: 'gemini',
        enabled: true,
        has_key: true,
        state: 'Ready',
        model: 'gemini-2.5-flash',
      },
      gemini_candidate_models: ['gemini-2.5-flash'],
    });
    verifyAISettings.mockResolvedValue({
      active_provider: 'gemini',
      verified_at: '2026-08-14T00:00:00Z',
      results: {
        gemini: {
          provider: 'gemini',
          configured: true,
          success: true,
          model: 'gemini-2.5-flash',
          candidates: ['gemini-2.5-flash'],
        },
        gpt: {
          provider: 'gpt',
          configured: false,
          success: false,
          candidates: [],
          error_code: 'provider_key_missing',
          error_message: 'OpenAI API key is missing.',
        },
      },
    });
  });

  test('renders runtime model and verification results', async () => {
    render(<AISettingsPanel />);

    await waitFor(() => expect(screen.getByText('Current Runtime')).toBeInTheDocument());
    expect(screen.getByText('Model:')).toBeInTheDocument();
    expect(screen.getAllByText('gemini-2.5-flash').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Verify Keys & Model Access'));

    await waitFor(() => expect(screen.getByText(/Verification finished/i)).toBeInTheDocument());
    expect(screen.getByText('Verification Result')).toBeInTheDocument();
    expect(screen.getByText('Action needed')).toBeInTheDocument();
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0);
  });
});