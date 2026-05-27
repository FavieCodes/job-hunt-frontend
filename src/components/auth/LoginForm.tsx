'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import GoogleButton from '@/components/auth/GoogleButton';
import { login, saveSession } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fields.email.includes('@')) e.email = 'Enter a valid email address';
    if (!fields.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(fields.email, fields.password);
      saveSession(data.accessToken, data.user);
      toast.success(`Welcome back, ${data.user.username}!`);
      if (data.user.is_confirmed === false) {
        router.push('/check-email');
      } else {
        router.push('/jobs');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Invalid email or password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <GoogleButton label="Sign in with Google" />

      <div className="divider">or sign in with email</div>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="email" label="Email address" type="email"
          value={fields.email} onChange={set('email')} error={errors.email}
          placeholder="you@example.com" autoComplete="email"
        />
        <Input
          id="password" label="Password" showPasswordToggle
          value={fields.password} onChange={set('password')} error={errors.password}
          placeholder="Your password" autoComplete="current-password"
        />
        <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 20 }}>
          <Link href="/forgot-password" style={{ fontSize: '0.875rem' }}>
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer">
        No account? <Link href="/signup">Create one free</Link>
      </p>
    </>
  );
}