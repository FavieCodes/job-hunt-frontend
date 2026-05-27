'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUser, resendConfirmation } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function CheckEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const handleResend = async () => {
    if (!email || !canResend) return;
    setLoading(true);
    try {
      await resendConfirmation(email);
      toast.success('Confirmation email resent!');
      setCanResend(false);
      setCountdown(30);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.email) setEmail(user.email);
  }, []);

  useEffect(() => {
    if (canResend) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [canResend]);

  useEffect(() => {
    if (countdown <= 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  return (
    <div className="check-email-page">
      <div className="check-email-card">
        <div className="check-email-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 7l10 7 10-7"/>
          </svg>
        </div>

        <h1>Check your inbox</h1>
        <p className="check-email-body">
          We sent a confirmation link to{' '}
          {email ? <strong>{email}</strong> : 'your email address'}.
          <br />
          Click it to activate your account and start your job search.
        </p>

        <div className="check-email-steps">
          <div className="step">
            <span className="step-num">1</span>
            <span>Open your email app</span>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <span>Find the email from <strong>JobHunt</strong></span>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <span>Click <strong>"Confirm my account"</strong></span>
          </div>
        </div>

        <p className="check-email-hint">
          Can't find it? Check your spam folder.
        </p>

        <div className="check-email-actions" style={{ gap: '12px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', width: 'auto' }}
            onClick={handleResend}
            disabled={!email || loading || !canResend}
          >
            {loading ? 'Sending...' : canResend ? 'Resend Email' : `Resend in ${countdown}s`}
          </button>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
            Go to Login
          </Link>
        </div>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          Wrong email? <Link href="/signup">Sign up again</Link>
        </p>
      </div>
    </div>
  );
}