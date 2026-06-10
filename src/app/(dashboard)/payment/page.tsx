'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'this feature';

  const plans = [
    {
      name: 'Pro',
      price: '$9',
      period: '/month',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
      features: [
        'Unlimited Resume Generations',
        'Unlimited Interview Prep Sessions',
        'Unlimited Portfolio Builds',
        'Priority AI Processing',
        'Download & Export (PDF, HTML)',
        'Email Support',
      ],
      cta: 'Get Pro',
      popular: true,
    },
    {
      name: 'Team',
      price: '$29',
      period: '/month',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      features: [
        'Everything in Pro',
        'Up to 5 Team Members',
        'Shared Workspace',
        'Advanced Analytics',
        'Custom Branding',
        'Priority Support',
      ],
      cta: 'Get Team',
      popular: false,
    },
  ];

  const featureLabel = {
    resume: 'Resume Builder',
    interview: 'Interview Prep',
    portfolio: 'Portfolio Builder',
  }[feature] || feature;

  return (
    <div className="payment-page" suppressHydrationWarning>
      {/* Header */}
      <div className="payment-header">
        <button onClick={() => router.back()} className="back-btn">
          <i className="fas fa-arrow-left"></i> Go Back
        </button>
      </div>

      {/* Hero */}
      <div className="payment-hero">
        <div className="limit-badge">
          <i className="fas fa-lock"></i> Daily Limit Reached
        </div>
        <h1 className="payment-title">
          Unlock Unlimited <span className="highlight">{featureLabel}</span>
        </h1>
        <p className="payment-subtitle">
          You&apos;ve used your free daily generation. Upgrade to a paid plan to continue without limits.
        </p>
      </div>

      {/* Plans */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-header" style={{ background: plan.gradient }}>
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
            </div>
            <div className="plan-body">
              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <i className="fas fa-check-circle" style={{ color: plan.color }}></i>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="plan-cta"
                style={{ background: plan.gradient }}
                onClick={() => alert(`Payment integration coming soon! This will subscribe you to ${plan.name}.`)}
              >
                {plan.cta} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Free tier reminder */}
      <div className="free-tier-note">
        <i className="fas fa-info-circle"></i>
        Your free plan resets every 24 hours — come back tomorrow for another free generation.
      </div>

      <style>{`
        .payment-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem 1rem 4rem;
        }
        .payment-header {
          margin-bottom: 2rem;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: .9rem;
          transition: color .2s;
        }
        .back-btn:hover { color: var(--color-primary); }
        .payment-hero {
          text-align: center;
          margin-bottom: 3rem;
        }
        .limit-badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .4rem 1rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 2rem;
          font-size: .8rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }
        .payment-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: .75rem;
          line-height: 1.2;
        }
        .highlight {
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .payment-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .plan-card {
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: 1.25rem;
          overflow: hidden;
          position: relative;
          transition: transform .2s, box-shadow .2s;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,.12);
        }
        .plan-card.popular {
          border-color: #06b6d4;
        }
        .popular-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: .25rem .75rem;
          background: white;
          color: #0e7490;
          border-radius: 2rem;
          font-size: .75rem;
          font-weight: 700;
          z-index: 1;
        }
        .plan-header {
          padding: 1.75rem 1.5rem;
          color: white;
        }
        .plan-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: .5rem;
          opacity: .9;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: .25rem;
        }
        .price-amount {
          font-size: 2.5rem;
          font-weight: 800;
        }
        .price-period {
          font-size: .9rem;
          opacity: .8;
        }
        .plan-body {
          padding: 1.5rem;
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }
        .plan-features li {
          display: flex;
          align-items: center;
          gap: .6rem;
          font-size: .9rem;
          color: var(--color-text);
        }
        .plan-features i {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .plan-cta {
          width: 100%;
          padding: .85rem;
          border: none;
          border-radius: .75rem;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          transition: opacity .2s;
        }
        .plan-cta:hover { opacity: .9; }
        .free-tier-note {
          text-align: center;
          color: var(--color-text-muted);
          font-size: .85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
        }
        .free-tier-note i { color: #06b6d4; }
        @media (max-width: 640px) {
          .payment-title { font-size: 1.5rem; }
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}