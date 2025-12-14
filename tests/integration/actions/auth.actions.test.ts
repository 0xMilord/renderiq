/**
 * Integration tests for auth actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  signInAction,
  signUpAction,
  signOutAction,
  signInWithGoogleAction,
  signInWithGithubAction,
  getCurrentUserAction,
  refreshSessionAction,
} from '@/lib/actions/auth.actions';
import { AuthService } from '@/lib/services/auth';

// Mock auth service
vi.mock('@/lib/services/auth', () => ({
  AuthService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshSession: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInAction', () => {
    it('should sign in user successfully', async () => {
      vi.mocked(AuthService.signIn).mockResolvedValue({
        success: true,
        data: { user: { id: '123' } },
      });

      await expect(signInAction('test@example.com', 'password123')).rejects.toThrow(); // redirect throws
      expect(AuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return error on failed sign in', async () => {
      vi.mocked(AuthService.signIn).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      // Note: This will throw due to redirect, so we need to catch it
      try {
        await signInAction('test@example.com', 'wrongpassword');
      } catch (error) {
        // Expected - redirect throws
      }

      expect(AuthService.signIn).toHaveBeenCalled();
    });
  });

  describe('signUpAction', () => {
    it('should sign up user successfully', async () => {
      vi.mocked(AuthService.signUp).mockResolvedValue({
        success: true,
        data: { user: { id: '123' } },
      });

      const result = await signUpAction('test@example.com', 'password123', 'Test User');

      expect(result.success).toBe(true);
      expect(AuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });

    it('should return error on failed sign up', async () => {
      vi.mocked(AuthService.signUp).mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      const result = await signUpAction('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('signOutAction', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(AuthService.signOut).mockResolvedValue({
        success: true,
      });

      await expect(signOutAction()).rejects.toThrow(); // redirect throws
      expect(AuthService.signOut).toHaveBeenCalled();
    });
  });

  describe('signInWithGoogleAction', () => {
    it('should initiate Google OAuth', async () => {
      vi.mocked(AuthService.signInWithOAuth).mockResolvedValue({
        success: true,
        data: { url: 'https://oauth.google.com/auth' },
      });

      await expect(signInWithGoogleAction()).rejects.toThrow(); // redirect throws
      expect(AuthService.signInWithOAuth).toHaveBeenCalledWith('google');
    });
  });

  describe('signInWithGithubAction', () => {
    it('should initiate GitHub OAuth', async () => {
      vi.mocked(AuthService.signInWithOAuth).mockResolvedValue({
        success: true,
        data: { url: 'https://oauth.github.com/auth' },
      });

      await expect(signInWithGithubAction()).rejects.toThrow(); // redirect throws
      expect(AuthService.signInWithOAuth).toHaveBeenCalledWith('github');
    });
  });

  describe('getCurrentUserAction', () => {
    it('should return current user', async () => {
      vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
        success: true,
        data: { user: { id: '123', email: 'test@example.com' } },
      });

      const result = await getCurrentUserAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('refreshSessionAction', () => {
    it('should refresh session', async () => {
      vi.mocked(AuthService.refreshSession).mockResolvedValue({
        success: true,
        data: { session: { access_token: 'token' } },
      });

      const result = await refreshSessionAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

