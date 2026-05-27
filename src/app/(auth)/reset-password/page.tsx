import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'New Password — JobHunt' };

export default function ResetPasswordPage() {
  return (
    <div className="auth-form-box">
      <h1>Set new password</h1>
      <p className="subtitle">Choose a strong password for your account.</p>
      <Suspense fallback={<p>Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}