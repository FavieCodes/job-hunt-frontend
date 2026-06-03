'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import GoogleButton from '@/components/auth/GoogleButton';
import { signup } from '@/lib/auth';

export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fields.email.includes('@')) e.email = 'Enter a valid email address';
    if (fields.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (fields.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!fields.confirmPassword) {
      e.confirmPassword = 'Please confirm your password';
    } else if (fields.password !== fields.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(fields.email, fields.username, fields.password);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingEmail', fields.email);
      }

      toast.success('Account created! Check your inbox to confirm your email.');
      router.push('/check-email');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Signup failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <GoogleButton label="Sign up with Google" />

      <div className="divider">or sign up with email</div>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="email" label="Email address" type="email"
          value={fields.email} onChange={set('email')} error={errors.email}
          placeholder="you@example.com" autoComplete="email"
        />
        <Input
          id="username" label="Username" type="text"
          value={fields.username} onChange={set('username')} error={errors.username}
          placeholder="johndoe" autoComplete="username"
        />
        <Input
          id="password" label="Password" showPasswordToggle showStrength
          value={fields.password} onChange={set('password')} error={errors.password}
          placeholder="Min. 8 characters" autoComplete="new-password"
        />
        <Input
          id="confirmPassword" label="Confirm Password" showPasswordToggle
          value={fields.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword}
          placeholder="Re-enter your password" autoComplete="new-password"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}