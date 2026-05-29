'use client';
import { useEffect, useState, useCallback } from 'react';
import { jobsAPI, userAPI } from '@/lib';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  country: string;
  state: string;
  city: string;
  job_type: string;
  salary: string;
  apply_url: string;
  posted_at: string;
  // Admin-only fields
  applied_count?: number;
  saved_count?: number;
}

// Confirm-applied modal
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
          <h3><i className="fas fa-paper-plane"></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">
            You are being redirected to the application page for{' '}
            <strong>{job.title}</strong> at <strong>{job.company || 'this company'}</strong>.
          </p>
          <p className="modal-question">
            <i className="fas fa-question-circle"></i>{' '}
            Did you complete your application on the external site?
          </p>
          <div className="modal-actions">
            <button onClick={onCancel} className="btn-no">
              <i className="fas fa-times"></i> No, not yet
            </button>
            <button onClick={onConfirm} className="btn-yes">
              <i className="fas fa-check"></i> Yes, I applied!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', job_type: '', q: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // User-specific state
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingJob, setSavingJob] = useState<string | null>(null);

  // Confirm-apply modal state
  const [pendingApply, setPendingApply] = useState<Job | null>(null);

  useEffect(() => {
    const u = getUser();
    setCurrentUser(u);
  }, []);

  useEffect(() => {
    fetchJobs();
    if (currentUser && currentUser.role !== 'admin') {
      fetchUserState();
    }
  }, [filters, currentUser]);

  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      setFilters((prev) => ({ ...prev, q: event.detail, page: 1 }));
    };
    window.addEventListener('globalSearch', handleGlobalSearch);
    return () => window.removeEventListener('globalSearch', handleGlobalSearch);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobsAPI.searchJobs(filters);
      // For admin, also fetch applied/saved counts per job
      if (currentUser?.role === 'admin') {
        const jobsWithStats = await Promise.all(
          (data.jobs || []).map(async (job: Job) => {
            try {
              const { data: stats } = await api.get(`/admin/jobs/${job.id}/stats`);
              return { ...job, applied_count: stats.applied_count, saved_count: stats.saved_count };
            } catch {
              return { ...job, applied_count: 0, saved_count: 0 };
            }
          })
        );
        setJobs(jobsWithStats);
      } else {
        setJobs(data.jobs || []);
      }
      setTotalPages(data.pages || 1);
      setTotalJobs(data.total || 0);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserState = async () => {
    try {
      const [applications, saved] = await Promise.all([
        userAPI.getApplications(),
        userAPI.getSavedJobs(),
      ]);
      setAppliedJobs(new Set(applications.map((app: any) => app.job_id)));
      setSavedJobs(new Set(saved.map((j: any) => j.id)));
    } catch {
      // non-critical
    }
  };

  // Step 1: open external site + show confirm modal
  const handleApplyClick = (job: Job) => {
    if (job.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    // Small delay so user lands on the external tab first
    setTimeout(() => setPendingApply(job), 500);
  };

  // Step 2: user confirms they applied → record in DB
  const handleConfirmApplied = async () => {
    if (!pendingApply) return;
    try {
      await userAPI.applyForJob(pendingApply.id);
      setAppliedJobs((prev) => new Set([...prev, pendingApply.id]));
      toast.success('Application recorded! Good luck 🎉');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record application');
    } finally {
      setPendingApply(null);
    }
  };

  // Save / unsave
  const handleSave = async (job: Job) => {
    if (savingJob === job.id) return;
    setSavingJob(job.id);
    try {
      if (savedJobs.has(job.id)) {
        await userAPI.removeSavedJob(job.id);
        setSavedJobs((prev) => { const s = new Set(prev); s.delete(job.id); return s; });
        toast.success('Removed from saved');
      } else {
        await userAPI.saveJob(job.id);
        setSavedJobs((prev) => new Set([...prev, job.id]));
        toast.success('Job saved!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save job');
    } finally {
      setSavingJob(null);
    }
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': '#10b981',
      'part-time': '#f59e0b',
      remote: '#06b6d4',
      contract: '#8b5cf6',
      internship: '#ef4444',
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Confirm apply modal */}
      {pendingApply && (
        <ConfirmApplyModal
          job={pendingApply}
          onConfirm={handleConfirmApplied}
          onCancel={() => setPendingApply(null)}
        />
      )}

      <div className="page-header">
        <h1><i className="fas fa-briefcase"></i> {isAdmin ? 'Manage Jobs' : 'Find Your Dream Job'}</h1>
        <p>
          {isAdmin
            ? `${totalJobs} jobs on the platform`
            : `Discover ${totalJobs}+ opportunities from top companies worldwide`}
        </p>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-input-large">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by job title, company, or keywords..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
          />
        </div>
        <div className="filter-group">
          <select
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value, page: 1 })}
          >
            <option value="">All Countries</option>
            <option value="Nigeria">Nigeria</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Remote">Remote</option>
          </select>
          <select
            value={filters.job_type}
            onChange={(e) => setFilters({ ...filters, job_type: e.target.value, page: 1 })}
          >
            <option value="">All Job Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="remote">Remote</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      <div className="results-count">
        <span>Found {totalJobs} jobs</span>
        <button
          onClick={() => setFilters({ country: '', job_type: '', q: '', page: 1 })}
          className="clear-filters"
        >
          Clear all filters
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="jobs-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="company-logo">{job.company?.[0] || 'J'}</div>
                <div className="job-info">
                  <h3 className="job-title">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p className="company-name">{job.company || 'Company'}</p>
                </div>
                <span
                  className="job-type"
                  style={{ backgroundColor: getJobTypeColor(job.job_type) }}
                >
                  {job.job_type || 'Full-time'}
                </span>
              </div>

              <div className="job-details">
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{job.city || job.state || job.country || 'Remote'}</span>
                </div>
                {job.salary && (
                  <div className="detail-item">
                    <i className="fas fa-dollar-sign"></i>
                    <span>{job.salary}</span>
                  </div>
                )}
                <div className="detail-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>
                    {job.posted_at
                      ? new Date(job.posted_at).toLocaleDateString()
                      : 'Recently posted'}
                  </span>
                </div>
              </div>

              {job.description && (
                <p className="job-description">{job.description.slice(0, 150)}…</p>
              )}

              <div className="job-card-footer">
                {isAdmin ? (
                  /* Admin view: show applied/saved counts, no action buttons */
                  <div className="admin-job-stats">
                    <span className="admin-stat">
                      <i className="fas fa-paper-plane"></i>
                      {job.applied_count ?? 0} applied
                    </span>
                    <span className="admin-stat">
                      <i className="fas fa-bookmark"></i>
                      {job.saved_count ?? 0} saved
                    </span>
                    <Link href={`/admin/jobs/${job.id}/edit`} className="admin-edit-btn">
                      <i className="fas fa-pen"></i> Edit
                    </Link>
                  </div>
                ) : (
                  /* User view: apply + save */
                  <>
                    <button
                      onClick={() => {
                        if (!appliedJobs.has(job.id)) handleApplyClick(job);
                      }}
                      className={`apply-btn ${appliedJobs.has(job.id) ? 'applied' : ''}`}
                      disabled={appliedJobs.has(job.id)}
                    >
                      {appliedJobs.has(job.id) ? (
                        <><i className="fas fa-check"></i> Applied</>
                      ) : (
                        <><i className="fas fa-paper-plane"></i> Apply Now</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSave(job)}
                      className={`save-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                      disabled={savingJob === job.id}
                      title={savedJobs.has(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                      <i
                        className={`${savedJobs.has(job.id) ? 'fas' : 'far'} fa-bookmark`}
                      ></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No jobs found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="page-btn"
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="page-info">
            Page {filters.page} of {totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === totalPages}
            className="page-btn"
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      <style jsx>{`
        /* Modal */
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
        }
        .modal-box {
          background: var(--color-surface);
          border-radius: 1rem;
          width: 90%; max-width: 440px;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-header h3 { font-size: 1.1rem; color: var(--color-text); display: flex; align-items: center; gap: .5rem; }
        .modal-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--color-text-muted); }
        .modal-body { padding: 1.5rem; }
        .modal-desc { color: var(--color-text); margin-bottom: 1rem; line-height: 1.6; }
        .modal-question {
          display: flex; align-items: center; gap: .5rem;
          color: var(--color-text); font-weight: 600;
          margin-bottom: 1.25rem;
        }
        .modal-question i { color: #06b6d4; }
        .modal-actions { display: flex; gap: .75rem; }
        .btn-no {
          flex: 1; padding: .7rem; border: 1.5px solid var(--color-border);
          background: var(--color-bg); color: var(--color-text);
          border-radius: .5rem; cursor: pointer; font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: .4rem;
        }
        .btn-yes {
          flex: 1; padding: .7rem;
          background: #10b981; color: white; border: none;
          border-radius: .5rem; cursor: pointer; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: .4rem;
        }
        .btn-yes:hover { background: #059669; }
        /* Admin stats */
        .admin-job-stats {
          display: flex; align-items: center; gap: .75rem; width: 100%; flex-wrap: wrap;
        }
        .admin-stat {
          display: flex; align-items: center; gap: .35rem;
          font-size: .8rem; color: var(--color-text-muted);
          background: var(--color-bg);
          padding: .3rem .6rem; border-radius: 1rem;
          border: 1px solid var(--color-border);
        }
        .admin-stat i { font-size: .75rem; }
        .admin-edit-btn {
          margin-left: auto;
          display: flex; align-items: center; gap: .35rem;
          padding: .4rem .9rem;
          background: #dbeafe; color: #1e40af;
          border-radius: .5rem; text-decoration: none;
          font-size: .8rem; font-weight: 600; transition: background .2s;
        }
        .admin-edit-btn:hover { background: #bfdbfe; }
        /* Save button states */
        .save-btn.saved { color: #06b6d4; }
        .save-btn.saved i { color: #06b6d4; }
        /* Page layout */
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 2rem; color: var(--color-text); margin-bottom: .5rem; }
        .page-header p  { color: var(--color-text-muted); }
        .filters-container {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;
        }
        .search-input-large {
          display: flex; align-items: center; gap: 1rem;
          padding: .75rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: .75rem; margin-bottom: 1rem;
        }
        .search-input-large i { color: var(--color-text-muted); }
        .search-input-large input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--color-text); font-size: 1rem;
        }
        .filter-group { display: flex; gap: 1rem; }
        .filter-group select {
          flex: 1; padding: .75rem;
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: .75rem; color: var(--color-text); cursor: pointer;
        }
        .results-count {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; color: var(--color-text-muted);
        }
        .clear-filters { background: none; border: none; color: var(--color-primary); cursor: pointer; }
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem; margin-bottom: 2rem;
        }
        @media (max-width: 768px) {
          .jobs-grid { grid-template-columns: 1fr; }
          .filter-group { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}