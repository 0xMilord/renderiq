import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/services/email.service';
import { logger } from '@/lib/utils/logger';
import { getAuthRedirectUrl } from '@/lib/utils/auth-redirect';

/**
 * Supabase Auth Webhook Handler
 * 
 * This webhook receives auth events from Supabase and sends custom emails via Resend.
 * 
 * To set up:
 * 1. Go to Supabase Dashboard → Database → Webhooks
 * 2. Create a new webhook
 * 3. Table: auth.users
 * 4. Events: INSERT, UPDATE
 * 5. HTTP Request URL: https://yourdomain.com/api/webhooks/supabase-auth
 * 6. HTTP Request Method: POST
 * 7. HTTP Request Headers: 
 *    - Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
 * 8. Enable "Enable retries" and set retry count to 3
 */

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      logger.error('❌ SupabaseAuthWebhook: Unauthorized webhook request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { type, table, record, old_record } = payload;

    logger.log('📧 SupabaseAuthWebhook: Received webhook:', { type, table, record_id: record?.id });

    // Only process auth.users table events
    if (table !== 'auth.users') {
      return NextResponse.json({ received: true });
    }

    // Handle INSERT event (new user signup)
    if (type === 'INSERT' && record) {
      const user = record;
      const email = user.email;
      const emailConfirmed = user.email_confirmed_at;

      // Send verification email if not confirmed
      if (!emailConfirmed && email) {
        try {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          );

          // Generate verification link
          // CRITICAL: Always use production URL, never localhost
          const baseUrl = getAuthRedirectUrl(request);
          const emailRedirectTo = `${baseUrl}/auth/callback`;
          
          logger.log('🔧 SupabaseAuthWebhook: emailRedirectTo:', emailRedirectTo);
          
          const { data: tokenData, error: tokenError } = await adminClient.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              redirectTo: emailRedirectTo,
            },
          });

          // ⚠️ DISABLED RESEND: Supabase automatically sends verification emails with custom templates
          // No need to send via Resend - Supabase handles it automatically when user signs up
          // Custom templates are configured in Supabase Dashboard → Authentication → Email Templates
          logger.log('✅ SupabaseAuthWebhook: User signed up, Supabase will send verification email automatically:', email);
        } catch (error) {
          logger.error('❌ SupabaseAuthWebhook: Error sending verification email:', error);
        }
      }
    }

    // Handle UPDATE event (email verified, password reset, etc.)
    if (type === 'UPDATE' && record && old_record) {
      const user = record;
      const oldUser = old_record;
      const email = user.email;
      const emailConfirmed = user.email_confirmed_at;
      const oldEmailConfirmed = oldUser.email_confirmed_at;

      // Email was just verified - send welcome email
      if (!oldEmailConfirmed && emailConfirmed && email) {
        try {
          // Wait a bit for profile to be created
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get user profile to check if it exists
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          );

          // Check if profile exists in users table
          const { data: profile } = await adminClient
            .from('users')
            .select('name, email')
            .eq('id', user.id)
            .single();

          if (profile) {
            await sendWelcomeEmail({
              name: profile.name || user.user_metadata?.name || 'User',
              email: profile.email || email,
              subject: 'Welcome to Renderiq!',
              content: '',
            });
            logger.log('✅ SupabaseAuthWebhook: Welcome email sent via Resend:', email);
          }
        } catch (error) {
          logger.error('❌ SupabaseAuthWebhook: Error sending welcome email:', error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('❌ SupabaseAuthWebhook: Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

