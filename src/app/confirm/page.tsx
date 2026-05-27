'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { confirmEmail, saveSession } from '@/lib/auth';
import toast from 'react-hot-toast';

function ConfirmContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    confirmEmail(token)
      .then((data) => {
        if (data.accessToken && data.user) {
          saveSession(data.accessToken, data.user);
        }
        setStatus('success');
        toast.success('Email confirmed successfully!');
        router.push('/jobs');
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
        {status === 'loading' && <p>Confirming your email…</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Email confirmed!</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Redirecting to dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
            <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Confirmation failed</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>The link may be invalid or expired.</p>
            <Link href="/signup" className="btn btn-primary" style={{ display: 'inline-flex' }}>Try Again</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}