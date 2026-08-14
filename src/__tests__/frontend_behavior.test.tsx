import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NavigationHeader } from '../components/NavigationHeader';
import { HomeUploadPage } from '../components/HomeUploadPage';
import { RunsDashboard } from '../components/RunsDashboard';
import { AppState } from '../types';

const listRuns = vi.fn();
const retryRun = vi.fn();

vi.mock('../services/apiClient', () => ({
  ApiError: class ApiError extends Error {},
  uploadDocuments: vi.fn(),
  uploadCodebase: vi.fn(),
  retryRun: (...args: any[]) => retryRun(...args),
  listRuns: () => listRuns(),
}));

describe('NavigationHeader Tab Gating', () => {
  test('renders simplified sidebar tabs', () => {
    const handleTabChange = vi.fn();
    
    render(
      <NavigationHeader
        activeTab="home"
        onTabChange={handleTabChange}
        collapsed={false}
        onToggleCollapsed={vi.fn()}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Home'));
    expect(handleTabChange).toHaveBeenCalledWith('home');
  });

  test('routes to runs and tools', () => {
    const handleTabChange = vi.fn();
    
    render(
      <NavigationHeader
        activeTab="home"
        onTabChange={handleTabChange}
        collapsed={false}
        onToggleCollapsed={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Runs'));
    expect(handleTabChange).toHaveBeenCalledWith('runs');

    fireEvent.click(screen.getByText('Tools'));
    expect(handleTabChange).toHaveBeenCalledWith('tools');
  });
});

describe('Spec-Kit 011 Choreography & Staged Agent Surface', () => {
  test('renders orchestration container, upcoming agent preview, and subagents', () => {
    render(
      <HomeUploadPage
        appState={null}
        onRefreshStatus={vi.fn()}
        onProceedToUnderstanding={vi.fn()}
        onCreateNewRun={vi.fn()}
      />
    );

    expect(screen.getByText(/Execution Workspace & Agent Orchestration/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Agent:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1. Requirement Understanding Agent/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/2. Document Intake Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Application Understanding Agent/i)).toBeInTheDocument();
    expect(screen.getByText('Active Hero')).toBeInTheDocument();
    expect(screen.getByText(/Subagent Stream & Live Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Requirement Parser & 15-Point Checklist Evaluator/i)).toBeInTheDocument();
  });

  test('supports dual upload lane expansion, filtering, and retry invalidation', async () => {
    retryRun.mockResolvedValue({
      run_id: 'RUN-20260814-001',
      reset_generation: 2,
      state: { run_id: 'RUN-20260814-001', status: 'idle', progress: 0 },
    });

    const mockState: AppState = {
      run_id: 'RUN-20260814-001',
      project_name: 'CFA Digital Journey',
      status: 'indexing',
      progress: 66.6,
      reset_generation: 1,
      intake_manifest: {
        upload_id: 'up_01',
        zip_filename: 'cfa_app.zip',
        extracted_path: '/uploads/extracted',
        total_files: 42,
        total_size_bytes: 1048576,
        doc_files: ['cfa_spec.md'],
        files: [
          { rel_path: 'src/App.tsx', size_bytes: 1200, extension: '.tsx', is_binary: false },
          { rel_path: 'assets/logo.png', size_bytes: 4500, extension: '.png', is_binary: true },
        ],
        excluded_file_count: 1,
        created_at: '2026-08-14T00:00:00Z',
      },
      stage_timestamps: {},
    };

    const handleRefresh = vi.fn();

    render(
      <HomeUploadPage
        appState={mockState}
        onRefreshStatus={handleRefresh}
        onProceedToUnderstanding={vi.fn()}
        onCreateNewRun={vi.fn()}
      />
    );

    expect(screen.getByText('1 Docs Indexed')).toBeInTheDocument();
    expect(screen.getByText('42 Files Extracted')).toBeInTheDocument();
    expect(screen.getByText('Requirement Documents Lane')).toBeInTheDocument();
    expect(screen.getByText('Target Codebase ZIP Lane')).toBeInTheDocument();

    // Expand ZIP details and filter
    const expandBtn = screen.getByText('Expand File List');
    fireEvent.click(expandBtn);
    expect(screen.getByText('src/App.tsx')).toBeInTheDocument();

    // Click retry step on Requirement Understanding Agent
    const retryButtons = screen.getAllByText('Retry Step');
    expect(retryButtons.length).toBeGreaterThan(0);
    fireEvent.click(retryButtons[0]);

    await waitFor(() => {
      expect(retryRun).toHaveBeenCalledWith('RUN-20260814-001', 'requirement_understanding');
    });
  });

  test('displays live processing activity text and active subagents during AI stage', () => {
    const mockRunningState: AppState = {
      run_id: 'RUN-20260814-RUNNING',
      project_name: 'CFA Digital Journey',
      status: 'ai_understanding_running',
      progress: 80.0,
      intake_manifest: {
        upload_id: 'up_02',
        zip_filename: 'cfa_app.zip',
        extracted_path: '/uploads/extracted',
        total_files: 10,
        total_size_bytes: 51200,
        doc_files: ['spec.md'],
        files: [],
        created_at: '2026-08-14T00:00:00Z',
      },
      stage_timestamps: {},
    };

    render(
      <HomeUploadPage
        appState={mockRunningState}
        onRefreshStatus={vi.fn()}
        onProceedToUnderstanding={vi.fn()}
        onCreateNewRun={vi.fn()}
      />
    );

    expect(screen.getByText(/Parsing TypeScript & React component AST/i)).toBeInTheDocument();
  });
});

describe('RunsDashboard previous runs and report artifacts', () => {
  test('renders previous runs list with report links and allows opening run', async () => {
    const handleOpenRun = vi.fn();
    listRuns.mockResolvedValue({
      runs: [
        {
          run_id: 'RUN-HISTORICAL-001',
          project_name: 'CFA Digital Journey',
          status: 'ready',
          progress: 100,
          total_files: 25,
          doc_count: 2,
          has_html_report: true,
          has_pdf_report: true,
          has_understanding: true,
          updated_at: '2026-08-14T10:00:00Z',
        },
      ],
    });

    render(<RunsDashboard onOpenRun={handleOpenRun} activeRunId="RUN-CURRENT" />);

    await waitFor(() => expect(screen.getByText('RUN-HISTORICAL-001')).toBeInTheDocument());
    expect(screen.getByText('HTML Report')).toBeInTheDocument();
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
    expect(screen.getByText('Understanding Ready')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open in Workspace'));
    expect(handleOpenRun).toHaveBeenCalledWith('RUN-HISTORICAL-001');
  });
});
