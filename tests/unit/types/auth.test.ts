/**
 * Tests for auth type definitions and validations
 */

import { describe, it, expect } from 'vitest';
import type {
  AuthResult,
  UserProfile,
  UserCredits,
  CreditTransaction,
  AuthSession,
  OAuthProvider,
  SignInForm,
  SignUpForm,
  UseAuthReturn,
  AvatarOptions,
  AvatarStyle,
} from '@/lib/types/auth';

describe('Auth Types', () => {
  describe('AuthResult', () => {
    it('should have correct structure for success result', () => {
      const result: AuthResult = {
        success: true,
        data: { user: { id: '123' } },
      };
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should have correct structure for error result', () => {
      const result: AuthResult = {
        success: false,
        error: 'Authentication failed',
      };
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('UserProfile', () => {
    it('should have all required fields', () => {
      const profile: UserProfile = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        isAdmin: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(profile.id).toBeDefined();
      expect(profile.email).toBeDefined();
      expect(profile.isActive).toBeDefined();
      expect(profile.isAdmin).toBeDefined();
      expect(profile.emailVerified).toBeDefined();
    });

    it('should allow optional fields', () => {
      const profile: UserProfile = {
        id: '123',
        email: 'test@example.com',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(profile.name).toBeUndefined();
      expect(profile.avatar).toBeUndefined();
      expect(profile.bio).toBeUndefined();
    });
  });

  describe('UserCredits', () => {
    it('should have all required fields', () => {
      const credits: UserCredits = {
        id: '123',
        userId: 'user-123',
        balance: 100,
        totalEarned: 200,
        totalSpent: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(credits.balance).toBe(100);
      expect(credits.totalEarned).toBe(200);
      expect(credits.totalSpent).toBe(100);
    });

    it('should allow optional lastResetAt', () => {
      const credits: UserCredits = {
        id: '123',
        userId: 'user-123',
        balance: 100,
        totalEarned: 200,
        totalSpent: 100,
        lastResetAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(credits.lastResetAt).toBeDefined();
    });
  });

  describe('CreditTransaction', () => {
    it('should have all required fields', () => {
      const transaction: CreditTransaction = {
        id: '123',
        userId: 'user-123',
        amount: 10,
        type: 'spent',
        description: 'Render generation',
        createdAt: new Date(),
      };
      
      expect(transaction.type).toBe('spent');
      expect(transaction.amount).toBe(10);
    });

    it('should allow optional reference fields', () => {
      const transaction: CreditTransaction = {
        id: '123',
        userId: 'user-123',
        amount: 10,
        type: 'spent',
        description: 'Render generation',
        referenceId: 'render-123',
        referenceType: 'render',
        createdAt: new Date(),
      };
      
      expect(transaction.referenceId).toBe('render-123');
      expect(transaction.referenceType).toBe('render');
    });

    it('should accept all transaction types', () => {
      const types: CreditTransaction['type'][] = ['earned', 'spent', 'refund', 'bonus'];
      
      for (const type of types) {
        const transaction: CreditTransaction = {
          id: '123',
          userId: 'user-123',
          amount: 10,
          type,
          description: 'Test',
          createdAt: new Date(),
        };
        
        expect(transaction.type).toBe(type);
      }
    });
  });

  describe('OAuthProvider', () => {
    it('should accept valid OAuth providers', () => {
      const providers: OAuthProvider[] = ['google', 'github'];
      
      for (const provider of providers) {
        expect(provider).toBeDefined();
      }
    });
  });

  describe('SignInForm', () => {
    it('should have email and password', () => {
      const form: SignInForm = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(form.email).toBeDefined();
      expect(form.password).toBeDefined();
    });
  });

  describe('SignUpForm', () => {
    it('should have email and password', () => {
      const form: SignUpForm = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      expect(form.email).toBeDefined();
      expect(form.password).toBeDefined();
    });

    it('should allow optional name', () => {
      const form: SignUpForm = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      
      expect(form.name).toBe('Test User');
    });
  });

  describe('AvatarOptions', () => {
    it('should allow all optional fields', () => {
      const options: AvatarOptions = {
        seed: 'test-seed',
        size: 100,
        backgroundColor: ['#ff0000'],
        eyes: ['happy'],
        flip: true,
        rotate: 45,
        scale: 1.5,
        radius: 10,
      };
      
      expect(options.seed).toBe('test-seed');
      expect(options.size).toBe(100);
    });
  });

  describe('AvatarStyle', () => {
    it('should accept all valid styles', () => {
      const styles: AvatarStyle[] = ['professional', 'casual', 'colorful', 'minimal'];
      
      for (const style of styles) {
        expect(style).toBeDefined();
      }
    });
  });
});

