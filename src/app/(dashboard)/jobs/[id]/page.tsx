'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jobsAPI } from '@/lib';
import { userAPI } from '@/lib';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Job } from '@/lib/jobs';

function ConfirmApplyModal({
  job,
  onConfirm,
  onCancel,
}: {
  job: Job;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-paper-plane" style={{ color: '#06b6d4' }}></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close"><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">You were redirected to the external application page for <strong>{job.title}</strong>.</p>
          <p className="modal-question">
            <i className="fas fa-question-circle" style={{ color: '#06b6d4' }}></i>
            &nbsp;Did you complete your application?
          </p>
          <div className="modal-actions">
            <button className="btn-no" onClick={onCancel}><i className="fas fa-times"></i> Not yet</button>
            <button className="btn-yes" onClick={onConfirm}><i className="fas fa-check"></i> Yes, I applied!</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'full-time':  { bg: '#d1fae5', text: '#065f46' },
  'part-time':  { bg: '#fef3c7', text: '#92400e' },
  'remote':     { bg: '#e0f2fe', text: '#0c4a6e' },
  'contract':   { bg: '#ede9fe', text: '#4c1d95' },
  'internship': { bg: '#fee2e2', text: '#7f1d1d' },
};

export default function JobDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id as string;

  const [job, setJob]         = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState<any>(null);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [pendingApply, setPendingApply] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (id) fetchJob();
  }, [id]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      checkUserState();
    }
  }, [user, id]);

  const fetchJob = async () => {
    try {
      const data = await jobsAPI.getJobById(id);
      setJob(data);
    } catch {
      toast.error('Job not found');
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkUserState = async () => {
    try {
      const [apps, savedList] = await Promise.all([
        userAPI.getApplications(),
        userAPI.getSavedJobs(),
      ]);
      setApplied(apps.some((a: any) => a.job_id === id));
      setSaved(savedList.some((j: any) => j.id === id));
    } catch {}
  };

  const handleApplyClick = () => {
    if (job?.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setPendingApply(true), 400);
  };

  const handleConfirmApplied = async () => {
    try {
      await userAPI.applyForJob(id);
      setApplied(true);
      toast.success('Application recorded! Good luck 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record application');
    } finally {
      setPendingApply(false);
    }
  };

  const handleSave = async () => {
    if (savingJob) return;
    setSavingJob(true);
    try {
      if (saved) {
        await api.delete(`/user/saved/${id}`);
        setSaved(false);
        toast.success('Removed from saved');
      } else {
        await api.post('/user/saved', { job_id: id });
        setSaved(true);
        toast.success('Job saved!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setSavingJob(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const typeStyle = job ? (TYPE_COLORS[job.job_type?.toLowerCase()] || { bg: '#f3f4f6', text: '#374151' }) : null;

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div className="skeleton-card" style={{ height: '400px', borderRadius: '1rem' }}></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {pendingApply && job && (
        <ConfirmApplyModal
          job={job}
          onConfirm={handleConfirmApplied}
          onCancel={() => setPendingApply(false)}
        />
      )}

      {/* Back link */}
      <div className="back-row">
        <button onClick={() => router.back()} className="back-btn">
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <Link href="/jobs" className="all-jobs-link">View all jobs →</Link>
      </div>

      {/* Main card */}
      <div className="detail-card">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-logo">{job.company?.[0]?.toUpperCase() || 'J'}</div>
          <div className="detail-title-block">
            <h1 className="detail-job-title">{job.title}</h1>
            <p className="detail-company">{job.company || 'Company'}</p>
          </div>
          {typeStyle && (
            <span className="detail-type-badge" style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {job.job_type}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="detail-meta">
          {(job.city || job.state || job.country) && (
            <span className="meta-chip">
              <i className="fas fa-map-marker-alt"></i>
              {[job.city, job.state, job.country].filter(Boolean).join(', ')}
            </span>
          )}
          {job.salary && (
            <span className="meta-chip">
              <i className="fas fa-dollar-sign"></i> {job.salary}
            </span>
          )}
          {job.posted_at && (
            <span className="meta-chip">
              <i className="fas fa-calendar-alt"></i> {new Date(job.posted_at).toLocaleDateString()}
            </span>
          )}
          {job.source_name && (
            <span className="meta-chip">
              <i className="fas fa-globe"></i> {job.source_name}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isAdmin && (
          <div className="detail-actions">
            <button
              onClick={() => { if (!applied) handleApplyClick(); }}
              className={`apply-btn-lg ${applied ? 'applied' : ''}`}
              disabled={applied}
            >
              {applied
                ? <><i className="fas fa-check-circle"></i> Applied</>
                : <><i className="fas fa-paper-plane"></i> Apply Now</>}
            </button>
            <button
              onClick={handleSave}
              disabled={savingJob}
              className={`save-btn-lg ${saved ? 'saved' : ''}`}
            >
              <i className={saved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
              {saved ? ' Saved' : ' Save Job'}
            </button>
            {job.apply_url && (
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="external-link-btn">
                <i className="fas fa-external-link-alt"></i> Open Application
              </a>
            )}
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div className="detail-section">
            <h2 className="section-heading"><i className="fas fa-file-alt"></i> Job Description</h2>
            <div className="description-body">
              {job.description.split('\n').map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : <br key={i} />
              )}
            </div>
          </div>
        )}

        {/* Details panel */}
        <div className="detail-section">
          <h2 className="section-heading"><i className="fas fa-info-circle"></i> Job Details</h2>
          <div className="details-grid">
            <div className="detail-item-block">
              <span className="detail-label">Job Type</span>
              <span className="detail-value">{job.job_type || '—'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Location</span>
              <span className="detail-value">
                {[job.city, job.state, job.country].filter(Boolean).join(', ') || 'Remote'}
              </span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Salary</span>
              <span className="detail-value">{job.salary || 'Not specified'}</span>
            </div>
            <div className="detail-item-block">
              <span className="detail-label">Posted</span>
              <span className="detail-value">
                {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            {job.source_name && (
              <div className="detail-item-block">
                <span className="detail-label">Source</span>
                <span className="detail-value">{job.source_name}</span>
              </div>
            )}
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
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .detail-logo {
          width: 64px; height: 64px; flex-shrink: 0;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
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
        .detail-type-badge {
          padding: .3rem .85rem; border-radius: 1rem;
          font-size: .8rem; font-weight: 700; text-transform: capitalize;
          white-space: nowrap;
        }
        .detail-meta {
          display: flex; flex-wrap: wrap; gap: .75rem;
          margin-bottom: 1.75rem;
        }
        .meta-chip {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .35rem .85rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          font-size: .82rem; color: var(--color-text-muted);
        }
        .meta-chip i { color: #06b6d4; }
        .detail-actions {
          display: flex; gap: 1rem; flex-wrap: wrap;
          margin-bottom: 2rem;
          padding-bottom: 1.75rem;
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
        .apply-btn-lg.applied {
          background: #10b981; cursor: default;
        }
        .apply-btn-lg:disabled { opacity: .85; cursor: default; }
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
        .external-link-btn {
          display: flex; align-items: center; gap: .5rem;
          padding: .8rem 1.4rem;
          border: 1.5px solid var(--color-border);
          border-radius: .75rem; color: var(--color-text-muted);
          text-decoration: none; font-size: .9rem; transition: all .2s;
        }
        .external-link-btn:hover { border-color: #06b6d4; color: #06b6d4; }
        .detail-section { margin-bottom: 1.75rem; }
        .section-heading {
          font-size: 1.1rem; font-weight: 700;
          color: var(--color-text);
          display: flex; align-items: center; gap: .5rem;
          margin-bottom: 1rem;
          padding-bottom: .6rem;
          border-bottom: 2px solid var(--color-border);
        }
        .section-heading i { color: #06b6d4; }
        .description-body p {
          color: var(--color-text); line-height: 1.75;
          margin-bottom: .75rem; font-size: .95rem;
        }
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
        .detail-value { font-size: .95rem; font-weight: 600; color: var(--color-text); text-transform: capitalize; }
        /* Confirm modal */
        .modal-overlay { position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:999;padding:1rem; }
        .modal-box { background:var(--color-surface);border-radius:1rem;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.2); }
        .modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid var(--color-border); }
        .modal-header h3 { font-size:1.1rem;color:var(--color-text);display:flex;align-items:center;gap:.5rem; }
        .modal-close { background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:1.1rem; }
        .modal-body { padding:1.5rem; }
        .modal-desc { color:var(--color-text-muted);font-size:.875rem;margin-bottom:.75rem;line-height:1.6; }
        .modal-question { font-weight:600;color:var(--color-text);font-size:.95rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.4rem; }
        .modal-actions { display:flex;gap:.75rem; }
        .btn-no { flex:1;padding:.7rem;border:1.5px solid var(--color-border);background:var(--color-bg);color:var(--color-text);border-radius:.6rem;cursor:pointer;font-weight:500;display:flex;align-items:center;justify-content:center;gap:.4rem; }
        .btn-no:hover { border-color:#ef4444;color:#ef4444; }
        .btn-yes { flex:1;padding:.7rem;background:#10b981;color:white;border:none;border-radius:.6rem;cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;gap:.4rem; }
        .btn-yes:hover { background:#059669; }
        @media(max-width:640px) {
          .detail-job-title { font-size:1.3rem; }
          .detail-actions { flex-direction:column; }
          .apply-btn-lg,.save-btn-lg,.external-link-btn { width:100%;justify-content:center; }
        }
      `}</style>
    </div>
  );
}