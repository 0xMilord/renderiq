'use server';

import { revalidatePath } from 'next/cache';
import { BillingService } from '@/lib/services/billing';
import { createClient } from '@/lib/supabase/server';

export async function getUserCredits() {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await BillingService.getUserCredits(user.data.user.id);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user credits',
    };
  }
}

export async function addCredits(
  amount: number,
  type: 'earned' | 'spent' | 'refund' | 'bonus',
  description: string,
  referenceId?: string,
  referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await BillingService.addCredits(
      user.data.user.id,
      amount,
      type,
      description,
      referenceId,
      referenceType
    );

    if (result.success) {
      revalidatePath('/billing');
      revalidatePath('/profile');
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add credits',
    };
  }
}

export async function deductCredits(
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await BillingService.deductCredits(
      user.data.user.id,
      amount,
      description,
      referenceId,
      referenceType
    );

    if (result.success) {
      revalidatePath('/billing');
      revalidatePath('/profile');
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deduct credits',
    };
  }
}

export async function getCreditTransactions(page = 1, limit = 20) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    // This would need to be implemented in BillingService
    // For now, return a placeholder
    return { success: true, data: [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get credit transactions',
    };
  }
}

export async function getUserSubscription() {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    // This would need to be implemented in BillingService
    // For now, return mock data
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      plan: {
        id: 'pro',
        name: 'Pro Plan',
        price: 15,
        interval: 'month',
        creditsPerMonth: 100,
      }
    };

    return { success: true, subscription: mockSubscription };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get subscription',
    };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await BillingService.cancelSubscription(subscriptionId);
    
    if (result.success) {
      revalidatePath('/billing');
      revalidatePath('/profile');
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}
