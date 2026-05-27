import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Reset Password — JobHunt' };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-form-box">
      <h1>Forgot password?</h1>
      <p className="subtitle">Enter your email and we'll send you a reset link.</p>
      <ForgotPasswordForm />
    </div>
  );
}