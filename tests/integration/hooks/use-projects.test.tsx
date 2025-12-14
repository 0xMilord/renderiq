/**
 * Integration tests for useProjects hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/lib/hooks/use-projects';
import { getUserProjects, createProject } from '@/lib/actions/projects.actions';

vi.mock('@/lib/actions/projects.actions', () => ({
  getUserProjects: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
}));

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getUserProjects).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useProjects());

    expect(result.current.loading).toBe(true);
    expect(result.current.projects).toEqual([]);
  });

  it('should fetch projects on mount', async () => {
    const mockProjects = [{ id: '1', name: 'Project 1' }];
    vi.mocked(getUserProjects).mockResolvedValue({
      success: true,
      data: mockProjects as any,
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
  });

  it('should handle fetch errors', async () => {
    vi.mocked(getUserProjects).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should add project', async () => {
    vi.mocked(getUserProjects).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(createProject).mockResolvedValue({
      success: true,
      data: { id: 'new-project', name: 'New Project' } as any,
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const formData = new FormData();
    formData.append('projectName', 'New Project');

    await result.current.addProject(formData);

    expect(createProject).toHaveBeenCalled();
  });
});

