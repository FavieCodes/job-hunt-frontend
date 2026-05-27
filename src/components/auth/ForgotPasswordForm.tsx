'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { forgotPassword } from '@/lib/auth';

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // API deliberately doesn't reveal if email exists — always show success
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div>
      <div className="alert alert-success">
        ✅ If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
      </div>
      <p className="auth-footer"><Link href="/login">← Back to login</Link></p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input id="email" label="Email address" type="email"
        value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com" autoComplete="email" />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <Spinner /> : null}
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="auth-footer"><Link href="/login">← Back to login</Link></p>
    </form>
  );
}