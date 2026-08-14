import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NavigationHeader } from '../components/NavigationHeader';
import { HomeUploadPage } from '../components/HomeUploadPage';

describe('NavigationHeader Tab Gating', () => {
  test('renders all tabs and gates them based on intake state', () => {
    const handleTabChange = vi.fn();
    
    // Intake not ready: Home enabled, Understanding disabled
    render(
      <NavigationHeader
        activeTab="home"
        onTabChange={handleTabChange}
        isIntakeReady={false}
        isUnderstandingReady={false}
        runId="RUN-TEST-001"
        zoomLevel={100}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Clicking Home works
    fireEvent.click(screen.getByText('Home'));
    expect(handleTabChange).toHaveBeenCalledWith('home');

    // Understanding should be disabled
    const understandingTab = screen.getByTitle('Upload docs or ZIP first to unblock');
    expect(understandingTab).toBeDisabled();
  });

  test('enables Understanding tab when intake is ready', () => {
    const handleTabChange = vi.fn();
    
    render(
      <NavigationHeader
        activeTab="home"
        onTabChange={handleTabChange}
        isIntakeReady={true}
        isUnderstandingReady={false}
        runId="RUN-TEST-001"
        zoomLevel={100}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomReset={vi.fn()}
      />
    );

    const understandingTab = screen.getByTitle('AI-First requirement & code analysis');
    expect(understandingTab).not.toBeDisabled();
    
    fireEvent.click(understandingTab);
    expect(handleTabChange).toHaveBeenCalledWith('understanding');
  });
});
