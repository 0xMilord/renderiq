'use server';

import { revalidatePath } from 'next/cache';
import { BillingService } from '@/lib/services/billing';
import { createClient } from '@/lib/supabase/server';

export async function getUserCredits() {
  console.log('🎯 BillingAction: Getting user credits');
  
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('❌ BillingAction: Authentication failed', { error: error?.message });
      return { success: false, error: 'Authentication required' };
    }

    console.log('🎯 BillingAction: Fetching credits for user', { userId: user.id });
    const result = await BillingService.getUserCredits(user.id);
    
    if (result.success) {
      console.log('✅ BillingAction: Credits retrieved successfully', { 
        userId: user.id, 
        balance: result.credits?.balance 
      });
    } else {
      console.error('❌ BillingAction: Failed to get credits', { 
        userId: user.id, 
        error: result.error 
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ BillingAction: Unexpected error getting credits', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
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
  console.log('🎯 BillingAction: Adding credits', { 
    amount, 
    type, 
    description, 
    referenceId, 
    referenceType 
  });
  
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('❌ BillingAction: Authentication failed', { error: error?.message });
      return { success: false, error: 'Authentication required' };
    }

    console.log('🎯 BillingAction: Processing credit addition', { 
      userId: user.id, 
      amount, 
      type 
    });

    const result = await BillingService.addCredits(
      user.id,
      amount,
      type,
      description,
      referenceId,
      referenceType
    );

    if (result.success) {
      console.log('✅ BillingAction: Credits added successfully', { 
        userId: user.id, 
        amount, 
        type,
        newBalance: 'newBalance' in result ? result.newBalance : 'unknown' 
      });
      revalidatePath('/billing');
      revalidatePath('/profile');
    } else {
      console.error('❌ BillingAction: Failed to add credits', { 
        userId: user.id, 
        amount, 
        type, 
        error: result.error 
      });
    }

    return result;
  } catch (error) {
    console.error('❌ BillingAction: Unexpected error adding credits', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      type
    });
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
  console.log('🎯 BillingAction: Deducting credits', { 
    amount, 
    description, 
    referenceId, 
    referenceType 
  });
  
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('❌ BillingAction: Authentication failed', { error: error?.message });
      return { success: false, error: 'Authentication required' };
    }

    console.log('🎯 BillingAction: Processing credit deduction', { 
      userId: user.id, 
      amount, 
      description 
    });

    const result = await BillingService.deductCredits(
      user.id,
      amount,
      description,
      referenceId,
      referenceType
    );

    if (result.success) {
      console.log('✅ BillingAction: Credits deducted successfully', { 
        userId: user.id, 
        amount, 
        newBalance: 'newBalance' in result ? result.newBalance : 'unknown'
      });
      revalidatePath('/billing');
      revalidatePath('/profile');
    } else {
      console.error('❌ BillingAction: Failed to deduct credits', { 
        userId: user.id, 
        amount, 
        error: result.error 
      });
    }

    return result;
  } catch (error) {
    console.error('❌ BillingAction: Unexpected error deducting credits', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      amount
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deduct credits',
    };
  }
}

export async function getCreditTransactions() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
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
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
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
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
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
