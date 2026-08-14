import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NavigationHeader } from '../components/NavigationHeader';
import { HomeUploadPage } from '../components/HomeUploadPage';

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
