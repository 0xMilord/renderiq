'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (user && user.email_confirmed_at) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setResendError('');

    // TODO: Implement resend verification email
    // This would call a Supabase function to resend the verification email

    setTimeout(() => {
      setIsResending(false);
      setResendSuccess(true);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Icon */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to{' '}
              <span className="font-medium text-foreground">
                {user?.email || 'your email address'}
              </span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  <strong>Check your inbox</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Look for an email from arqihive with a verification link
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  <strong>Click the verification link</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  This confirms your email address and activates your account
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground">
                  <strong>Start creating</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Once verified, you'll have full access to all features
                </p>
              </div>
            </div>
          </div>

          {/* Success message */}
          {resendSuccess && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Verification email sent! Check your inbox.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {resendError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendSuccess}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : resendSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Email sent!
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend verification email
                </>
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Back to sign in
              </Link>
            </div>
          </div>

          {/* Help text */}
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">
              <strong>Didn't receive the email?</strong>
              <br />
              Check your spam folder or click the button above to resend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

