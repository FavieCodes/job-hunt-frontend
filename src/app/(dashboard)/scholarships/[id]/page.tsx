'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { scholarshipsAPI, applicationsAPI } from '@/lib';
import { userAPI } from '@/lib';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Scholarship } from '@/lib/scholarships';

function ConfirmApplyModal({
  scholarship,
  onConfirm,
  onCancel,
}: {
  scholarship: Scholarship;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed-modal-overlay" onClick={onCancel}>
      <div className="fixed-modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-graduation-cap" style={{ color: '#06b6d4' }}></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close"><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">
          <div className="confirm-job-info">
            <div className="confirm-logo">{scholarship.provider?.[0]?.toUpperCase() || 'S'}</div>
            <div>
              <p className="confirm-job-title">{scholarship.title}</p>
              <p className="confirm-company">{scholarship.provider || 'Scholarship Provider'}</p>
            </div>
          </div>
          <p className="confirm-desc">You were redirected to the external application page.</p>
          <p className="confirm-question">
            <i className="fas fa-question-circle" style={{ color: '#06b6d4' }}></i>
            &nbsp;Did you complete your application on that site?
          </p>
          <div className="confirm-actions">
            <button className="btn-not-yet" onClick={onCancel}>
              <i className="fas fa-times"></i> Not yet
            </button>
            <button className="btn-yes-applied" onClick={onConfirm}>
              <i className="fas fa-check"></i> Yes, I applied!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScholarshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [scholarship, setScholarship]     = useState<Scholarship | null>(null);
  const [loading, setLoading]             = useState(true);
  const [user, setUser]                   = useState<any>(null);
  const [saved, setSaved]                 = useState(false);
  const [savingJob, setSavingJob]         = useState(false);
  const [applied, setApplied]             = useState(false);
  const [confirmingApply, setConfirmingApply] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (id) fetchScholarship();
  }, [id]);

  useEffect(() => {
    if (user && user.role !== 'admin') checkUserState();
  }, [user, id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && confirmingApply) {
        setShowConfirmModal(true);
        setConfirmingApply(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [confirmingApply]);

  const checkUserState = async () => {
    try {
      const savedList = await userAPI.getSavedScholarships();
      setSaved(savedList.some((s: any) => s.id === id));
    } catch {}
    try {
      const apps = await applicationsAPI.getApplications();
      setApplied(apps.some((a: any) => a.scholarship_id === id));
    } catch {}
  };

  const handleSave = async () => {
    if (savingJob) return;
    setSavingJob(true);
    try {
      if (saved) {
        await userAPI.removeSavedScholarship(id);
        setSaved(false);
        toast.success('Removed from saved');
      } else {
        await userAPI.saveScholarship(id);
        setSaved(true);
        toast.success('Scholarship saved!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setSavingJob(false);
    }
  };

  const handleApplyClick = () => {
    if (applied) return;
    if (scholarship?.apply_url) {
      window.open(scholarship.apply_url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setConfirmingApply(true), 400);
  };

  const handleConfirmApplied = async () => {
    setShowConfirmModal(false);
    try {
      await applicationsAPI.applyForScholarship(id);
      setApplied(true);
      toast.success('Application recorded! Good luck 🎉');
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        setApplied(true);
        toast.success('Already recorded!');
      } else {
        toast.error(msg || 'Failed to record application');
      }
    }
  };

  const fetchScholarship = async () => {
    try {
      const data = await scholarshipsAPI.getScholarshipById(id);
      setScholarship(data);
    } catch {
      toast.error('Scholarship not found');
      router.push('/scholarships');
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { text: 'Rolling deadline', color: '#10b981' };
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)  return { text: 'Closed', color: '#ef4444' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left ⚠️`, color: '#f59e0b' };
    return { text: `${daysLeft} days left`, color: '#06b6d4' };
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div className="skeleton-card" style={{ height: '400px', borderRadius: '1rem' }}></div>
      </div>
    );
  }

  if (!scholarship) return null;

  const deadlineInfo = getDeadlineStatus(scholarship.deadline);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {showConfirmModal && (
        <ConfirmApplyModal
          scholarship={scholarship}
          onConfirm={handleConfirmApplied}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <div className="back-row">
        <button onClick={() => router.back()} className="back-btn">
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <Link href="/scholarships" className="all-jobs-link">View all scholarships →</Link>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-logo">{scholarship.provider?.[0]?.toUpperCase() || 'S'}</div>
          <div className="detail-title-block">
            <h1 className="detail-job-title">{scholarship.title}</h1>
            <p className="detail-company">{scholarship.provider || 'Provider'}</p>
          </div>
          {scholarship.amount && (
            <span className="detail-type-badge scholarship-amount">{scholarship.amount}</span>
          )}
        </div>

        <div className="detail-meta">
          {scholarship.country && (
            <span className="meta-chip"><i className="fas fa-map-marker-alt"></i> {scholarship.country}</span>
          )}
          {scholarship.field && (
            <span className="meta-chip"><i className="fas fa-book"></i> {scholarship.field}</span>
          )}
          <span className="meta-chip">
            <i className="fas fa-clock"></i>{' '}
            <span style={{ color: deadlineInfo.color }}>{deadlineInfo.text}</span>
          </span>
        </div>

        {user?.role !== 'admin' && (
          <div className="detail-actions">
            <button
              onClick={handleSave}
              disabled={savingJob}
              className={`save-btn-lg ${saved ? 'saved' : ''}`}
            >
              <i className={saved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
              {saved ? ' Saved' : ' Save Scholarship'}
            </button>

            {applied ? (
              <span className="applied-badge-lg">
                <i className="fas fa-check-circle"></i> Applied
              </span>
            ) : scholarship.apply_url ? (
              <button
                onClick={handleApplyClick}
                className="apply-btn-lg"
              >
                <i className="fas fa-external-link-alt"></i> Apply Now
              </button>
            ) : null}
          </div>
        )}

        {scholarship.description && (
          <div className="detail-section">
            <h2 className="section-heading"><i className="fas fa-file-alt"></i> Description</h2>
            <div className="description-body">
              {scholarship.description.split('\n').map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2 className="section-heading"><i className="fas fa-info-circle"></i> Scholarship Details</h2>
          <div className="details-grid">
            <div className="detail-item-block">
              <span className="detail-label">Provider</span>
              <span className="detail-value">{scholarship.provider || '—'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Country</span>
              <span className="detail-value">{scholarship.country || 'Not specified'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Field of Study</span>
              <span className="detail-value">{scholarship.field || 'General'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Amount</span>
              <span className="detail-value">{scholarship.amount || 'Not specified'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Deadline</span>
              <span className="detail-value">
                {scholarship.deadline
                  ? new Date(scholarship.deadline).toLocaleDateString()
                  : 'Rolling'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .back-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .back-btn {
          display: flex; align-items: center; gap: .5rem;
          background: none; border: none; color: var(--color-text-muted);
          cursor: pointer; font-size: .9rem; transition: color .2s;
        }
        .back-btn:hover { color: var(--color-primary); }
        .all-jobs-link { color: var(--color-primary); text-decoration: none; font-size: .875rem; }
        .detail-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1.25rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .detail-header {
          display: flex; align-items: flex-start;
          gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .detail-logo {
          width: 64px; height: 64px; flex-shrink: 0;
          background: linear-gradient(135deg,#10b981,#047857);
          border-radius: 1rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.75rem; font-weight: 800; color: white;
        }
        .detail-title-block { flex: 1; }
        .detail-job-title {
          font-size: 1.6rem; font-weight: 800;
          color: var(--color-text); line-height: 1.2; margin-bottom: .35rem;
        }
        .detail-company { color: var(--color-text-muted); font-size: 1rem; }
        .detail-type-badge.scholarship-amount {
          padding: .3rem .85rem; border-radius: 1rem;
          font-size: .8rem; font-weight: 700;
          background: #dcfce7; color: #166534;
          white-space: nowrap; align-self: flex-start;
        }
        .detail-meta {
          display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.75rem;
        }
        .meta-chip {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .35rem .85rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 1rem; font-size: .82rem; color: var(--color-text-muted);
        }
        .meta-chip i { color: #06b6d4; }
        .detail-actions {
          display: flex; gap: 1rem; flex-wrap: wrap;
          margin-bottom: 2rem; padding-bottom: 1.75rem;
          border-bottom: 1px solid var(--color-border);
        }
        .apply-btn-lg {
          display: flex; align-items: center; gap: .5rem;
          padding: .8rem 1.75rem;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          color: white; border: none;
          border-radius: .75rem; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: opacity .2s;
        }
        .apply-btn-lg:hover { opacity: .9; }
        .save-btn-lg {
          display: flex; align-items: center; gap: .5rem;
          padding: .8rem 1.4rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          border-radius: .75rem; font-weight: 600; font-size: .95rem;
          color: var(--color-text); cursor: pointer; transition: all .2s;
        }
        .save-btn-lg.saved { border-color: #06b6d4; color: #06b6d4; }
        .save-btn-lg:hover:not(:disabled) { border-color: #06b6d4; }
        .applied-badge-lg {
          display: flex; align-items: center; gap: .5rem;
          padding: .8rem 1.4rem;
          background: #d1fae5; color: #065f46;
          border-radius: .75rem; font-weight: 700; font-size: .95rem;
          border: 1.5px solid #6ee7b7;
        }
        .applied-badge-lg i { color: #10b981; }
        .detail-section { margin-bottom: 1.75rem; }
        .section-heading {
          font-size: 1.1rem; font-weight: 700; color: var(--color-text);
          display: flex; align-items: center; gap: .5rem;
          margin-bottom: 1rem; padding-bottom: .6rem;
          border-bottom: 2px solid var(--color-border);
        }
        .section-heading i { color: #06b6d4; }
        .description-body p { color: var(--color-text); line-height: 1.75; margin-bottom: .75rem; font-size: .95rem; }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .detail-item-block {
          display: flex; flex-direction: column; gap: .25rem;
          padding: .875rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: .75rem;
        }
        .detail-label { font-size: .75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; }
        .detail-value { font-size: .95rem; font-weight: 600; color: var(--color-text); }
        @media(max-width:640px) {
          .detail-job-title { font-size:1.3rem; }
          .detail-actions { flex-direction:column; }
          .apply-btn-lg, .save-btn-lg { width:100%; justify-content:center; }
        }
      `}</style>

      {/* Global modal styles - same as job page */}
      <style global jsx>{`
        .fixed-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .fixed-modal-content {
          background: var(--color-surface);
          border-radius: 1rem;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        .fixed-modal-content.confirm-modal { max-width: 420px; }
        .fixed-modal-content.large { max-width: 680px; max-height: 90vh; overflow-y: auto; }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-header h3 {
          font-size: 1.1rem;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 1.1rem;
        }
        .modal-body { padding: 1.5rem; }
        .confirm-job-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-bg);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .confirm-logo {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #10b981, #047857);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }
        .confirm-job-title {
          font-weight: 700;
          color: var(--color-text);
          font-size: .95rem;
          margin-bottom: .15rem;
        }
        .confirm-company {
          color: var(--color-text-muted);
          font-size: .82rem;
        }
        .confirm-desc {
          color: var(--color-text-muted);
          font-size: .875rem;
          margin-bottom: .75rem;
        }
        .confirm-question {
          font-weight: 600;
          color: var(--color-text);
          font-size: .95rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: .4rem;
        }
        .confirm-actions { display: flex; gap: .75rem; }
        .btn-not-yet {
          flex: 1;
          padding: .7rem;
          border: 1.5px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          border-radius: .6rem;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          transition: border-color .2s;
        }
        .btn-not-yet:hover { border-color: #ef4444; color: #ef4444; }
        .btn-yes-applied {
          flex: 1;
          padding: .7rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: .6rem;
          cursor: pointer;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          transition: background .2s;
        }
        .btn-yes-applied:hover { background: #059669; }
      `}</style>
    </div>
  );
}