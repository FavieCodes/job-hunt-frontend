import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign In — JobHunt' };

export default function LoginPage() {
  return (
    <div className="auth-form-box">
      <h1>Welcome back</h1>
      <p className="subtitle">Sign in to continue your job search.</p>
      <LoginForm />
    </div>
  );
}