'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { resetPasswordWithToken } from '@/lib/auth';

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({ newPassword: '', confirmNewPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (fields.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    if (fields.newPassword !== fields.confirmNewPassword) e.confirmNewPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error('Missing reset token. Please use the link from your email.'); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPasswordWithToken(token, fields.newPassword, fields.confirmNewPassword);
      toast.success('Password reset! Please log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }));

  if (!token) return (
    <div className="alert alert-error">
      Invalid or missing reset token. <Link href="/forgot-password">Request a new link</Link>.
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input id="newPassword" label="New password" showPasswordToggle showStrength
        value={fields.newPassword} onChange={set('newPassword')} error={errors.newPassword}
        placeholder="Min. 8 characters" />
      <Input id="confirmNewPassword" label="Confirm new password" showPasswordToggle
        value={fields.confirmNewPassword} onChange={set('confirmNewPassword')}
        error={errors.confirmNewPassword} placeholder="Repeat your new password" />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <Spinner /> : null}
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  );
}