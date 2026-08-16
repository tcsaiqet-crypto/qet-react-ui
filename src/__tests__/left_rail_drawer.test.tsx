import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentPipelineRail } from '../components/AgentPipelineRail';
import { AppState } from '../types';

describe('Canonical 6-Agent Left Rail Navigation', () => {
  const mockAppState: AppState = {
    run_id: 'RUN-TEST-024',
    project_name: 'CFA Test Suite',
    status: 'idle',
    progress: 0,
    intake_manifest: {
      upload_id: 'RUN-TEST-024',
      zip_filename: 'source.zip',
      extracted_path: '/uploads/extracted',
      total_files: 42,
      total_size_bytes: 1048576,
      doc_files: ['spec.md', 'requirements.pdf'],
      created_at: new Date().toISOString(),
    },
    understanding: {
      summary: 'App summary',
      architecture_notes: 'React SPA',
      quality_score_percentage: 95,
      components: [
        {
          component_id: 'comp_login',
          name: 'LoginForm',
          type: 'form',
          file_path: 'src/Login.tsx',
          description: 'Login form component',
          selectors: ['#login-btn'],
        },
      ],
      flows: [
        {
          flow_id: 'flow_login',
          name: 'Login Flow',
          start_point: '/login',
          end_point: '/dashboard',
          steps: ['Enter credentials', 'Click submit'],
          description: 'User authentication journey',
        },
      ],
      entry_points: ['/login'],
      gaps: [],
      testability_observations: [],
      validation_status: 'valid',
      fallback_used: false,
      provenance: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        generated_at: new Date().toISOString(),
        fallback_used: false,
        validation_status: 'valid',
      },
    },
  };

  test('renders 6 canonical stages with sub-agents under Application Understanding', () => {
    const handleSelectAgent = vi.fn();

    render(
      <AgentPipelineRail
        appState={mockAppState}
        selectedAgentId="subagent_1a_req_intake"
        onSelectAgent={handleSelectAgent}
      />
    );

    // Expect 6 top-level stages
    expect(screen.getByText('1. Application Understanding Agent')).toBeInTheDocument();
    expect(screen.getByText('2. Test Case Generation Agent')).toBeInTheDocument();
    expect(screen.getByText('3. Data Generation Agent')).toBeInTheDocument();
    expect(screen.getByText('4. Test Script Agent')).toBeInTheDocument();
    expect(screen.getByText('5. Execute Agent')).toBeInTheDocument();
    expect(screen.getByText('6. Dashboard Agent')).toBeInTheDocument();

    // Expect sub-agents under parent
    expect(screen.getByText('1a. Requirement Intake')).toBeInTheDocument();
    expect(screen.getByText('1b. Codebase Intake')).toBeInTheDocument();
    expect(screen.getByText('1c. Requirement Understanding')).toBeInTheDocument();

    // Click sub-agent
    fireEvent.click(screen.getByText('1b. Codebase Intake'));
    expect(handleSelectAgent).toHaveBeenCalledWith('subagent_1b_codebase_intake');
  });
});
