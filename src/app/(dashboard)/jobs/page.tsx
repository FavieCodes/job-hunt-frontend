'use client';
import { useEffect, useState } from 'react';
import { jobsAPI, userAPI, applicationsAPI } from '@/lib';
import { adminJobsAPI } from '@/lib/jobs';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Job, AddJobForm } from '@/lib/jobs';

const JOBS_PER_PAGE = 12;

const emptyForm: AddJobForm = {
  title: '', company: '', description: '', country: '',
  city: '', job_type: 'full-time', salary: '', apply_url: '',
};

// ── Pagination component ──────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to   = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-wrapper">
      <p className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{totalItems}</strong> jobs
      </p>
      <div className="pagination">
        <button
          className="page-btn page-btn-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn page-num ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-btn page-btn-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

// ── Confirm-Apply Modal ───────────────────────────────────────────────────────
function ConfirmApplyModal({
  job,
  onConfirm,
  onCancel,
}: {
  job: Job;
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
          <h3><i className="fas fa-paper-plane" style={{ color: '#06b6d4' }}></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close"><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">
          <div className="confirm-job-info">
            <div className="confirm-logo">{job.company?.[0]?.toUpperCase() || 'J'}</div>
            <div>
              <p className="confirm-job-title">{job.title}</p>
              <p className="confirm-company">{job.company || 'Company'}</p>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({ country: '', job_type: '', q: '', page: 1 });
  const [totalPages, setTotalPages]   = useState(1);
  const [totalJobs, setTotalJobs]     = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs]     = useState<Set<string>>(new Set());
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [user, setUser]               = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm]         = useState<AddJobForm>(emptyForm);
  const [submitting, setSubmitting]   = useState(false);
  const [pendingApply, setPendingApply] = useState<Job | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    fetchJobs();
    if (user && user.role !== 'admin') {
      fetchAppliedJobs();
      fetchSavedJobs();
    }
  }, [filters, user]);

  useEffect(() => {
    const handler = (e: any) => setFilters((p) => ({ ...p, q: e.detail, page: 1 }));
    window.addEventListener('globalSearch', handler);
    return () => window.removeEventListener('globalSearch', handler);
  }, []);

  const isAdmin = user?.role === 'admin';

  const fetchJobs = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await adminJobsAPI.getAllJobs({ page: filters.page, limit: JOBS_PER_PAGE, search: filters.q });
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      } else {
        const data = await jobsAPI.searchJobs({ ...filters, limit: JOBS_PER_PAGE });
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      }
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const apps = await applicationsAPI.getApplications();
      setAppliedJobs(new Set(apps.map((a: any) => a.job_id).filter(Boolean)));
    } catch {}
  };

  const fetchSavedJobs = async () => {
    try {
      const saved = await userAPI.getSavedJobs();
      setSavedJobs(new Set(saved.map((j: any) => j.id)));
    } catch {}
  };

  const handleApplyClick = (job: Job) => {
    if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setPendingApply(job), 400);
  };

  const handleConfirmApplied = async () => {
    if (!pendingApply) return;
    try {
      await applicationsAPI.applyForJob(pendingApply.id);
      setAppliedJobs((prev) => new Set([...prev, pendingApply.id]));
      toast.success('Application recorded! Good luck 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record application');
    } finally {
      setPendingApply(null);
    }
  };

  const handleSave = async (jobId: string) => {
    if (savingId === jobId) return;
    setSavingId(jobId);
    try {
      if (savedJobs.has(jobId)) {
        await api.delete(`/user/saved/${jobId}`);
        setSavedJobs((prev) => { const s = new Set(prev); s.delete(jobId); return s; });
        toast.success('Job removed from saved');
      } else {
        await api.post('/user/saved', { job_id: jobId });
        setSavedJobs((prev) => new Set([...prev, jobId]));
        toast.success('Job saved!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save job');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddJob = async () => {
    if (!addForm.title.trim()) { toast.error('Job title is required'); return; }
    setSubmitting(true);
    try {
      await adminJobsAPI.createJob(addForm);
      toast.success('Job added successfully!');
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add job');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTypeColor = (type: string) => ({
    'full-time': '#088e61ff', 'part-time': '#a27117ff',
    'remote': '#18a5beff', 'contract': '#3d0eabff', 'internship': '#ef4444',
  }[type?.toLowerCase()] || '#0d3b96ff');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {pendingApply && (
        <ConfirmApplyModal
          job={pendingApply}
          onConfirm={handleConfirmApplied}
          onCancel={() => setPendingApply(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <div>
            <h1><i className="fas fa-briefcase"></i> {isAdmin ? 'Manage Jobs' : 'Find Your Dream Job'}</h1>
            <p>{isAdmin ? `${totalJobs} total jobs on the platform` : `Discover ${totalJobs}+ opportunities`}</p>
          </div>
          {isAdmin && (
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus"></i> Add Job
            </button>
          )}
        </div>
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
        {!isAdmin && (
          <div className="filter-group">
            <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, page: 1 })}>
              <option value="">All Countries</option>
              <option value="Nigeria">Nigeria</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Remote">Remote</option>
            </select>
            <select value={filters.job_type} onChange={(e) => setFilters({ ...filters, job_type: e.target.value, page: 1 })}>
              <option value="">All Job Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="remote">Remote</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        )}
      </div>

      <div className="results-count">
        <span>Found {totalJobs} jobs</span>
        <button onClick={() => setFilters({ country: '', job_type: '', q: '', page: 1 })} className="clear-filters">
          Clear all filters
        </button>
      </div>

      {/* Jobs grid */}
      {loading ? (
        <div className="jobs-grid">
          {Array.from({ length: JOBS_PER_PAGE }).map((_, i) => (
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
                <span className="job-type" style={{ backgroundColor: getTypeColor(job.job_type) }}>
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
                    <i className="fas fa-dollar-sign"></i><span>{job.salary}</span>
                  </div>
                )}
                <div className="detail-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>

              {job.description && (
                <p className="job-description">{job.description.slice(0, 120)}…</p>
              )}

              <div className="job-card-footer">
                {isAdmin ? (
                  <div className="engagement-stats">
                    <span className="engagement-badge applied-badge">
                      <i className="fas fa-paper-plane"></i> {job.applicant_count ?? 0} applied
                    </span>
                    <span className="engagement-badge saved-badge">
                      <i className="fas fa-bookmark"></i> {job.saved_count ?? 0} saved
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { if (!appliedJobs.has(job.id)) handleApplyClick(job); }}
                      className={`apply-btn ${appliedJobs.has(job.id) ? 'applied' : ''}`}
                      disabled={appliedJobs.has(job.id)}
                    >
                      {appliedJobs.has(job.id)
                        ? <><i className="fas fa-check"></i> Applied</>
                        : <><i className="fas fa-paper-plane"></i> Apply Now</>}
                    </button>
                    <button
                      className={`save-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                      onClick={() => handleSave(job.id)}
                      disabled={savingId === job.id}
                      title={savedJobs.has(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                      <i className={savedJobs.has(job.id) ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
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
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        totalItems={totalJobs}
        itemsPerPage={JOBS_PER_PAGE}
        onPageChange={handlePageChange}
      />

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fixed-modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add New Job</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close"><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  { label: 'Job Title *', key: 'title',    placeholder: 'e.g. Senior Backend Engineer' },
                  { label: 'Company',     key: 'company',  placeholder: 'e.g. Acme Corp' },
                  { label: 'Country',     key: 'country',  placeholder: 'e.g. Nigeria' },
                  { label: 'City',        key: 'city',     placeholder: 'e.g. Lagos' },
                  { label: 'Salary',      key: 'salary',   placeholder: 'e.g. $80,000/yr' },
                  { label: 'Apply URL',   key: 'apply_url', placeholder: 'https://…', type: 'url' },
                ].map(({ label, key, placeholder, type }) => (
                  <div className="form-group" key={key}>
                    <label>{label}</label>
                    <input
                      type={type || 'text'}
                      placeholder={placeholder}
                      value={(addForm as any)[key]}
                      onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>Job Type</label>
                  <select value={addForm.job_type} onChange={(e) => setAddForm({ ...addForm, job_type: e.target.value })}>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="remote">Remote</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea placeholder="Job description…" value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={4} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddJob} disabled={submitting} className="submit-btn">
                {submitting ? <><i className="fas fa-spinner fa-spin"></i> Adding…</> : <><i className="fas fa-plus"></i> Add Job</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .confirm-modal { max-width: 420px; }
        .confirm-job-info {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem; background: var(--color-bg);
          border-radius: 0.75rem; margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .confirm-logo {
          width: 44px; height: 44px; flex-shrink: 0;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          border-radius: 0.5rem;
          display:flex; align-items:center; justify-content:center;
          font-size: 1.2rem; font-weight:700; color:white;
        }
        .confirm-job-title { font-weight:700; color:var(--color-text); font-size:.95rem; margin-bottom:.15rem; }
        .confirm-company   { color:var(--color-text-muted); font-size:.82rem; }
        .confirm-desc      { color:var(--color-text-muted); font-size:.875rem; margin-bottom:.75rem; }
        .confirm-question  {
          font-weight:600; color:var(--color-text); font-size:.95rem;
          margin-bottom:1.25rem; display:flex; align-items:center; gap:.4rem;
        }
        .confirm-actions { display:flex; gap:.75rem; }
        .btn-not-yet {
          flex:1; padding:.7rem; border:1.5px solid var(--color-border);
          background:var(--color-bg); color:var(--color-text);
          border-radius:.6rem; cursor:pointer; font-weight:500;
          display:flex; align-items:center; justify-content:center; gap:.4rem;
          transition: border-color .2s;
        }
        .btn-not-yet:hover { border-color:#ef4444; color:#ef4444; }
        .btn-yes-applied {
          flex:1; padding:.7rem; background:#10b981; color:white;
          border:none; border-radius:.6rem; cursor:pointer; font-weight:700;
          display:flex; align-items:center; justify-content:center; gap:.4rem;
          transition: background .2s;
        }
        .btn-yes-applied:hover { background:#059669; }
        .save-btn.saved i { color: #06b6d4; }
        .header-row { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
        .add-btn {
          display:flex; align-items:center; gap:.5rem;
          padding:.75rem 1.5rem;
          background:var(--color-primary,#06b6d4); color:white;
          border:none; border-radius:.75rem; font-size:.95rem; font-weight:600;
          cursor:pointer; transition:all .2s; white-space:nowrap;
        }
        .add-btn:hover { opacity:.9; transform:translateY(-1px); }
        .page-header { margin-bottom:2rem; }
        .page-header h1 { font-size:2rem; color:var(--color-text); margin-bottom:.5rem; }
        .page-header p  { color:var(--color-text-muted); }
        .filters-container { background:var(--color-surface); border:1px solid var(--color-border); border-radius:1rem; padding:1.5rem; margin-bottom:1.5rem; }
        .search-input-large { display:flex; align-items:center; gap:1rem; padding:.75rem 1rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.75rem; margin-bottom:1rem; }
        .search-input-large i { color:var(--color-text-muted); }
        .search-input-large input { flex:1; background:none; border:none; outline:none; color:var(--color-text); font-size:1rem; }
        .filter-group { display:flex; gap:1rem; }
        .filter-group select { flex:1; padding:.75rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.75rem; color:var(--color-text); cursor:pointer; }
        .results-count { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; color:var(--color-text-muted); }
        .clear-filters { background:none; border:none; color:var(--color-primary); cursor:pointer; }
        .jobs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:1.5rem; margin-bottom:2rem; }
        .engagement-stats { display:flex; gap:.75rem; align-items:center; flex:1; }
        .engagement-badge { display:inline-flex; align-items:center; gap:.4rem; padding:.4rem .85rem; border-radius:2rem; font-size:.8rem; font-weight:600; }
        .applied-badge { background:#dbeafe; color:#1e40af; }
        .saved-badge   { background:#ede9fe; color:#6d28d9; }

        /* ── Pagination ──────────────────────────────────────────────────── */
        .pagination-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2rem;
          padding-bottom: 2rem;
        }
        .pagination-info {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }
        .pagination {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .page-btn {
          min-width: 38px;
          height: 38px;
          padding: 0 0.6rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--color-text);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          font-weight: 700;
        }
        .page-btn-arrow {
          font-size: 0.75rem;
        }
        .page-ellipsis {
          min-width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          font-size: 1rem;
        }

        @media(max-width:768px) {
          .jobs-grid { grid-template-columns:1fr; }
          .filter-group { flex-direction:column; }
          .form-grid { grid-template-columns:1fr; }
          .header-row { flex-direction:column; }
        }
      `}</style>
    </div>
  );
}