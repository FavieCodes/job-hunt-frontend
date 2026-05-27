import SignupForm from '@/components/auth/SignupForm';

export const metadata = { title: 'Create Account — JobHunt' };

export default function SignupPage() {
  return (
    <div className="auth-form-box">
      <h1>Create your account</h1>
      <p className="subtitle">Join thousands finding their dream roles.</p>
      <SignupForm />
    </div>
  );
}