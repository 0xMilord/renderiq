import { createClient } from '@/lib/supabase/server';
import { UserOnboardingService } from '@/lib/services/user-onboarding';
import { AvatarService } from '@/lib/services/avatar';
import { NextResponse } from 'next/server';
import { getPostAuthRedirectUrl } from '@/lib/utils/auth-redirect';

export async function GET(request: Request) {
  console.log('🔄 Auth Callback: Processing OAuth callback');
  console.log('🔄 Auth Callback: URL:', request.url);
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('🔄 Auth Callback: Code:', code ? 'present' : 'missing');
  console.log('🔄 Auth Callback: Origin:', origin);
  console.log('🔄 Auth Callback: Next:', next);

  if (code) {
    console.log('🔐 Auth Callback: Code received, exchanging for session');
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      console.log('✅ Auth Callback: Session created successfully');
      console.log('📧 Auth Callback: Email confirmed:', !!data.user.email_confirmed_at);
      
      // Only create profile if email is confirmed
      // OAuth providers (Google, GitHub) auto-confirm emails
      if (data.user.email_confirmed_at) {
        // Generate avatar if not provided from OAuth
        let avatarUrl = data.user.user_metadata?.avatar_url;
        if (!avatarUrl) {
          console.log('🎨 Auth Callback: Generating avatar for user:', data.user.email);
          avatarUrl = AvatarService.generateAvatarFromEmail(data.user.email!, {
            size: 128,
            backgroundColor: ['transparent'],
            backgroundType: ['solid'],
            eyesColor: ['4a90e2', '7b68ee', 'ff6b6b', '4ecdc4', '45b7d1'],
            mouthColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
            shapeColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
            radius: 8,
          });
        }
        
        // Create user profile (only for verified users)
        console.log('👤 Auth Callback: Creating user profile for verified user:', data.user.email);
        const profileResult = await UserOnboardingService.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
          avatar: avatarUrl,
        });
        
        if (!profileResult.success) {
          console.error('❌ Auth Callback: Failed to create user profile:', profileResult.error);
        } else {
          console.log('✅ Auth Callback: User profile created successfully');
        }
      } else {
        console.log('⚠️ Auth Callback: Email not verified yet, profile creation skipped');
      }
      
      // Use centralized redirect logic (handles localhost in dev)
      const redirectUrl = getPostAuthRedirectUrl(request, next);
      
      console.log('🔄 Auth Callback: Final redirect URL:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('❌ Auth Callback: Error exchanging code for session:', error);
    }
  }

  console.log('❌ Auth Callback: No code or error occurred, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
