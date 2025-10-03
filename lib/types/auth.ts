import type { User as SupabaseUser } from '@supabase/supabase-js';

// Auth result types
export interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User credits types
export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastResetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Credit transaction types
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent' | 'refund' | 'bonus';
  description: string;
  referenceId?: string;
  referenceType?: 'render' | 'subscription' | 'bonus' | 'refund';
  createdAt: Date;
}

// Auth session types
export interface AuthSession {
  user: SupabaseUser;
  session: any;
}

// OAuth provider types
export type OAuthProvider = 'google' | 'github';

// Auth form types
export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  name?: string;
}

// Auth hook return types
export interface UseAuthReturn {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithGithub: () => Promise<{ error: string | null }>;
}

// Avatar types
export interface AvatarOptions {
  seed?: string;
  size?: number;
  backgroundColor?: string[];
  backgroundType?: string[];
  eyes?: string[];
  eyesColor?: string[];
  face?: string[];
  mouth?: string[];
  mouthColor?: string[];
  shape?: string[];
  shapeColor?: string[];
  flip?: boolean;
  rotate?: number;
  scale?: number;
  radius?: number;
}

export type AvatarStyle = 'professional' | 'casual' | 'colorful' | 'minimal';

// Auth service method types
export interface AuthServiceMethods {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  getCurrentUser: () => Promise<AuthResult>;
  refreshSession: () => Promise<AuthResult>;
}

// Auth action types
export interface AuthActionMethods {
  signInAction: (email: string, password: string) => Promise<void>;
  signUpAction: (email: string, password: string, name?: string) => Promise<void>;
  signOutAction: () => Promise<void>;
  signInWithGoogleAction: () => Promise<void>;
  signInWithGithubAction: () => Promise<void>;
  getCurrentUserAction: () => Promise<AuthResult>;
  refreshSessionAction: () => Promise<AuthResult>;
}

// Auth DAL method types
export interface AuthDALMethods {
  getUserById: (userId: string) => Promise<UserProfile | null>;
  getUserByEmail: (email: string) => Promise<UserProfile | null>;
  createUser: (userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => Promise<UserProfile>;
  updateUser: (userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => Promise<UserProfile>;
  deleteUser: (userId: string) => Promise<boolean>;
  getUserCredits: (userId: string) => Promise<UserCredits | null>;
  createUserCredits: (userId: string, initialBalance?: number) => Promise<UserCredits>;
  updateUserCredits: (userId: string, updates: Partial<Omit<UserCredits, 'id' | 'userId' | 'createdAt'>>) => Promise<UserCredits>;
  createCreditTransaction: (userId: string, amount: number, type: CreditTransaction['type'], description: string, referenceId?: string, referenceType?: CreditTransaction['referenceType']) => Promise<void>;
  updateLastLogin: (userId: string) => Promise<void>;
  isUserActive: (userId: string) => Promise<boolean>;
  isUserAdmin: (userId: string) => Promise<boolean>;
}

// User onboarding types
export interface UserOnboardingProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export interface UserOnboardingMethods {
  createUserProfile: (userProfile: UserOnboardingProfile) => Promise<{ success: boolean; data?: UserProfile; error?: string }>;
  initializeUserCredits: (userId: string) => Promise<{ success: boolean; data?: UserCredits; error?: string }>;
  createWelcomeTransaction: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (userId: string, updates: Partial<UserOnboardingProfile>) => Promise<{ success: boolean; data?: UserProfile; error?: string }>;
  getUserProfile: (userId: string) => Promise<{ success: boolean; data?: UserProfile; error?: string }>;
}
