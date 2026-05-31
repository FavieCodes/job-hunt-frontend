'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchSavedJobs(); }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data } = await api.get('/user/saved');
      setSavedJobs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    try {
      await api.delete(`/user/saved/${jobId}`);
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success('Job removed from saved');
    } catch {
      toast.error('Failed to remove job');
    }
  };

  const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    'full-time':  { bg: '#d1fae5', text: '#065f46' },
    'part-time':  { bg: '#fef3c7', text: '#92400e' },
    'remote':     { bg: '#e0f2fe', text: '#0c4a6e' },
    'contract':   { bg: '#ede9fe', text: '#4c1d95' },
    'internship': { bg: '#fee2e2', text: '#7f1d1d' },
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="profile-header">
        <h1><i className="fas fa-bookmark"></i> Saved Jobs</h1>
        <p>Jobs you've saved for later — {savedJobs.length} total</p>
      </div>

      {loading ? (
        <div className="jobs-grid">
          {[1,2,3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: '200px', borderRadius: '1rem' }}></div>
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bookmark"></i>
          <h3>No saved jobs</h3>
          <p>Save jobs you're interested in and they'll appear here</p>
          <Link href="/jobs" className="apply-btn" style={{ display: 'inline-flex', width: 'auto', marginTop: '1rem' }}>
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="saved-grid">
          {savedJobs.map((job) => {
            const ts = TYPE_COLORS[job.job_type?.toLowerCase()] || { bg: '#f3f4f6', text: '#374151' };
            return (
              <div key={job.id} className="saved-card">
                {/* Card header */}
                <div className="sc-header">
                  <div className="sc-logo">{job.company?.[0]?.toUpperCase() || 'J'}</div>
                  <div className="sc-title-block">
                    <h3 className="sc-title">{job.title}</h3>
                    <p className="sc-company">{job.company || 'Company'}</p>
                  </div>
                  <span className="sc-type" style={{ background: ts.bg, color: ts.text }}>
                    {job.job_type || 'Full-time'}
                  </span>
                </div>

                {/* Meta */}
                <div className="sc-meta">
                  <span><i className="fas fa-map-marker-alt"></i> {job.city || job.state || job.country || 'Remote'}</span>
                  {job.salary && <span><i className="fas fa-dollar-sign"></i> {job.salary}</span>}
                  {job.saved_at && (
                    <span><i className="fas fa-clock"></i> Saved {new Date(job.saved_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Description preview */}
                {job.description && (
                  <p className="sc-desc">{job.description.slice(0, 120)}…</p>
                )}

                {/* Footer */}
                <div className="sc-footer">
                  {/* View Details → full detail page */}
                  <Link href={`/jobs/${job.id}`} className="sc-view-btn">
                    <i className="fas fa-eye"></i> View Details
                  </Link>

                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sc-apply-btn"
                    >
                      <i className="fas fa-paper-plane"></i> Apply Now
                    </a>
                  )}

                  <button
                    onClick={() => handleRemove(job.id)}
                    className="sc-remove-btn"
                    title="Remove from saved"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .saved-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: .9rem;
          transition: all .2s;
        }
        .saved-card:hover {
          border-color: #06b6d4;
          box-shadow: 0 6px 20px rgba(6,182,212,.1);
          transform: translateY(-2px);
        }
        .sc-header {
          display: flex; align-items: flex-start; gap: 1rem;
        }
        .sc-logo {
          width: 48px; height: 48px; flex-shrink: 0;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          border-radius: .75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 700; color: white;
        }
        .sc-title-block { flex: 1; min-width: 0; }
        .sc-title {
          font-size: 1rem; font-weight: 700;
          color: var(--color-text); line-height: 1.3;
          margin-bottom: .2rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sc-company { font-size: .82rem; color: var(--color-text-muted); }
        .sc-type {
          padding: .2rem .65rem; border-radius: 1rem;
          font-size: .72rem; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
          text-transform: capitalize;
        }
        .sc-meta {
          display: flex; flex-wrap: wrap; gap: .6rem;
          font-size: .78rem; color: var(--color-text-muted);
        }
        .sc-meta i { margin-right: .25rem; color: #06b6d4; }
        .sc-desc {
          font-size: .85rem; color: var(--color-text-muted);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sc-footer {
          display: flex; gap: .75rem; align-items: center;
          padding-top: .75rem;
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .sc-view-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .55rem 1.1rem;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          color: white; border-radius: .6rem;
          text-decoration: none; font-size: .85rem; font-weight: 600;
          transition: opacity .2s;
        }
        .sc-view-btn:hover { opacity: .9; }
        .sc-apply-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .55rem 1.1rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          color: var(--color-text);
          border-radius: .6rem;
          text-decoration: none; font-size: .85rem;
          transition: all .2s;
        }
        .sc-apply-btn:hover { border-color: #06b6d4; color: #06b6d4; }
        .sc-remove-btn {
          margin-left: auto;
          background: none; border: none;
          color: var(--color-text-muted);
          cursor: pointer; font-size: .95rem; padding: .4rem;
          border-radius: .5rem; transition: all .2s;
        }
        .sc-remove-btn:hover { background: #fee2e2; color: #ef4444; }
        @media(max-width:640px) {
          .saved-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}