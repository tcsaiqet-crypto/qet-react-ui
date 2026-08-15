import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentPipelineRail } from '../components/AgentPipelineRail';
import { AgentDetailDrawer } from '../components/AgentDetailDrawer';
import { HomeUploadPage } from '../components/HomeUploadPage';
import { AppState } from '../types';

describe('Spec-Kit 014: Left Rail Interactive Navigation', () => {
  const mockAppState: AppState = {
    run_id: 'RUN-TEST-014',
    project_name: 'CFA Test Suite',
    status: 'idle',
    progress: 0,
    intake_manifest: {
      upload_id: 'RUN-TEST-014',
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
      gaps: [
        {
          gap_id: 'GAP-1',
          title: 'Auth Validation',
          description: 'Passes all checks',
          category: 'Functional',
          severity: 'low',
          evidence_source: 'spec.md',
          confidence: 'high',
        },
      ],
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

  test('renders 3 Understanding stages by default and allows selection', () => {
    const handleSelectAgent = vi.fn();
    const handleToggleMode = vi.fn();

    render(
      <AgentPipelineRail
        appState={mockAppState}
        selectedAgentId="requirement_understanding"
        onSelectAgent={handleSelectAgent}
        viewMode="understanding_focus"
        onToggleViewMode={handleToggleMode}
      />
    );

    // Expect 3 understanding agents in focus view
    expect(screen.getByText('Requirement Understanding Agent')).toBeInTheDocument();
    expect(screen.getByText('Document Intake Agent')).toBeInTheDocument();
    expect(screen.getByText('Application Understanding Agent')).toBeInTheDocument();

    // Click Document Intake Agent
    fireEvent.click(screen.getByText('Document Intake Agent'));
    expect(handleSelectAgent).toHaveBeenCalledWith('document_intake');

    // Click Mode Toggle
    fireEvent.click(screen.getByText('All 11 Stages'));
    expect(handleToggleMode).toHaveBeenCalledWith('full_pipeline');
  });

  test('renders all 11 stages when full_pipeline mode is active', () => {
    render(
      <AgentPipelineRail
        appState={mockAppState}
        selectedAgentId="test_cases"
        onSelectAgent={vi.fn()}
        viewMode="full_pipeline"
      />
    );

    expect(screen.getByText('Requirement Understanding Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Case Generator Agent')).toBeInTheDocument();
    expect(screen.getByText('Execution Engine')).toBeInTheDocument();
    expect(screen.getByText('Reporting Agent')).toBeInTheDocument();
  });
});

describe('Spec-Kit 014: Right-Side Collapsible Drawer Inspector', () => {
  const mockAppState: AppState = {
    run_id: 'RUN-TEST-014',
    project_name: 'CFA Test Suite',
    status: 'understanding_ready',
    progress: 100,
    intake_manifest: {
      upload_id: 'RUN-TEST-014',
      zip_filename: 'archive.zip',
      extracted_path: '/uploads/extracted',
      total_files: 15,
      total_size_bytes: 512000,
      doc_files: ['requirements.md'],
      created_at: new Date().toISOString(),
    },
    understanding: {
      summary: 'Auth module',
      architecture_notes: 'Next.js application',
      quality_score_percentage: 88,
      components: [
        {
          component_id: 'comp_hdr',
          name: 'Header',
          type: 'header',
          file_path: 'components/Header.tsx',
          description: 'Header component',
          selectors: ['.header-nav'],
        },
      ],
      flows: [
        {
          flow_id: 'flow_nav',
          name: 'Navigation Flow',
          start_point: '/',
          end_point: '/about',
          steps: ['Click link'],
          description: 'Navigation journey',
        },
      ],
      entry_points: ['/'],
      gaps: [
        {
          gap_id: 'GAP-1',
          title: '15-Point Checklist Item 1',
          severity: 'medium',
          description: 'Partial coverage',
          category: 'Functional',
          evidence_source: 'requirements.md',
          confidence: 'medium',
        },
      ],
      testability_observations: [],
      validation_status: 'valid',
      fallback_used: false,
      provenance: {
        provider: 'gpt',
        model: 'gpt-4o',
        generated_at: new Date().toISOString(),
        fallback_used: false,
        validation_status: 'valid',
      },
    },
  };

  test('renders drawer with tabs and inspects selected agent', () => {
    const handleClose = vi.fn();
    const handleTabChange = vi.fn();

    render(
      <AgentDetailDrawer
        isOpen={true}
        onClose={handleClose}
        selectedAgentId="requirement_understanding"
        appState={mockAppState}
        activeTab="overview"
        onTabChange={handleTabChange}
      />
    );

    expect(screen.getByRole('heading', { name: /Requirement Understanding Agent/i })).toBeInTheDocument();
    expect(screen.getByText('requirements.md')).toBeInTheDocument();

    // Click close button
    fireEvent.click(screen.getByTitle('Close Inspector'));
    expect(handleClose).toHaveBeenCalled();

    // Switch tab to Subagents
    fireEvent.click(screen.getByText('Subagents'));
    expect(handleTabChange).toHaveBeenCalledWith('subagents');
  });

  test('inspects Application Understanding 15-point checklist artifacts', () => {
    render(
      <AgentDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        selectedAgentId="application_understanding"
        appState={mockAppState}
        activeTab="artifacts"
      />
    );

    expect(screen.getByRole('heading', { name: /Application Understanding Agent/i })).toBeInTheDocument();
    expect(screen.getByText('15-Point Requirement Checklist')).toBeInTheDocument();
    expect(screen.getByText('15-Point Checklist Item 1')).toBeInTheDocument();
    expect(screen.getByText('Copy JSON')).toBeInTheDocument();
  });
});

describe('Spec-Kit 014: HomeUploadPage Inspect Integration', () => {
  const mockAppStateWithDocs: AppState = {
    run_id: 'RUN-DOCS-INDEXED',
    project_name: 'CFA Digital Journey',
    status: 'uploading',
    progress: 30,
    intake_manifest: {
      upload_id: 'RUN-DOCS-INDEXED',
      zip_filename: '',
      extracted_path: '',
      total_files: 0,
      total_size_bytes: 0,
      doc_files: ['spec.md'],
      created_at: new Date().toISOString(),
    },
  };

  test('triggers onInspectAgent when Inspect button is clicked', () => {
    const handleInspect = vi.fn();

    render(
      <HomeUploadPage
        appState={mockAppStateWithDocs}
        onRefreshStatus={vi.fn()}
        onProceedToUnderstanding={vi.fn()}
        onCreateNewRun={vi.fn()}
        onInspectAgent={handleInspect}
      />
    );

    const inspectButtons = screen.getAllByTitle(/Inspect Agent Details/i);
    expect(inspectButtons.length).toBeGreaterThan(0);
    fireEvent.click(inspectButtons[0]);
    expect(handleInspect).toHaveBeenCalledWith('requirement_understanding');
  });
});
