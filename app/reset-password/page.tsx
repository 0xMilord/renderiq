import { ResetPasswordClient } from './reset-password-client';

// Force dynamic rendering to avoid SSR context issues
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
