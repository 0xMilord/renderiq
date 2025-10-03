'use server';

import { UserOnboardingService } from '@/lib/services/user-onboarding';

export async function getUserProfileAction(userId: string) {
  console.log('👤 UserOnboardingAction: Getting user profile for:', userId);
  
  const result = await UserOnboardingService.getUserProfile(userId);
  
  return result;
}

export async function createUserProfileAction(userProfile: {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}) {
  console.log('👤 UserOnboardingAction: Creating user profile for:', userProfile.email);
  
  const result = await UserOnboardingService.createUserProfile(userProfile);
  
  return result;
}

export async function updateUserProfileAction(userId: string, updates: {
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
}) {
  console.log('👤 UserOnboardingAction: Updating user profile for:', userId);
  
  const result = await UserOnboardingService.updateUserProfile(userId, updates);
  
  return result;
}
