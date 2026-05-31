'use client';
import { useEffect, useState } from 'react';
import { jobsAPI, userAPI } from '@/lib';
import { adminJobsAPI } from '@/lib/jobs';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Job, AddJobForm } from '@/lib/jobs';

const emptyForm: AddJobForm = {
  title: '', company: '', description: '', country: '',
  city: '', job_type: 'full-time', salary: '', apply_url: '',
};

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
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
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
          <p className="confirm-desc">
            You were redirected to the external application page.
          </p>
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

export default function JobsPage() {
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ country: '', job_type: '', q: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs]   = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs]   = useState<Set<string>>(new Set());
  const [savingId, setSavingId]     = useState<string | null>(null);
  const [user, setUser]             = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm]       = useState<AddJobForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Confirm-apply state
  const [pendingApply, setPendingApply] = useState<Job | null>(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

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
        const data = await adminJobsAPI.getAllJobs({ page: filters.page, limit: 20, search: filters.q });
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      } else {
        const data = await jobsAPI.searchJobs(filters);
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
      const apps = await userAPI.getApplications();
      setAppliedJobs(new Set(apps.map((a: any) => a.job_id)));
    } catch {}
  };

  const fetchSavedJobs = async () => {
    try {
      const saved = await userAPI.getSavedJobs();
      setSavedJobs(new Set(saved.map((j: any) => j.id)));
    } catch {}
  };

  const handleApplyClick = (job: Job) => {
    if (job.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setPendingApply(job), 400);
  };

  const handleConfirmApplied = async () => {
    if (!pendingApply) return;
    try {
      await userAPI.applyForJob(pendingApply.id);
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

  const getTypeColor = (type: string) => ({
    'full-time': '#8fe3c7ff', 'part-time': '#c0baafff',
    'remote': '#aadfe8ff', 'contract': '#a88beaff', 'internship': '#ef4444',
  }[type?.toLowerCase()] || '#6b7280');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* Confirm-apply modal */}
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
          {[1,2,3,4,5,6].map((i) => (
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
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page === 1} className="page-btn">
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="page-info">Page {filters.page} of {totalPages}</span>
          <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page === totalPages} className="page-btn">
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/*Job Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add New Job</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close"><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  { label: 'Job Title *', key: 'title', placeholder: 'e.g. Senior Backend Engineer' },
                  { label: 'Company', key: 'company', placeholder: 'e.g. Acme Corp' },
                  { label: 'Country', key: 'country', placeholder: 'e.g. Nigeria' },
                  { label: 'City', key: 'city', placeholder: 'e.g. Lagos' },
                  { label: 'Salary', key: 'salary', placeholder: 'e.g. $80,000/yr' },
                  { label: 'Apply URL', key: 'apply_url', placeholder: 'https://…', type: 'url' },
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
        /* Modals */
        .modal-overlay { 
          position:fixed; top:0;left:0;right:0;bottom:0; 
          background:rgba(0,0,0,0.7); 
          display:flex; align-items:center; justify-content:center; 
          z-index:999999; 
          padding:1rem;
          backdrop-filter: blur(4px);
        }
        .modal-content { 
          background:var(--color-surface); 
          border-radius:1rem; 
          width:90%; 
          max-width:400px; 
          box-shadow:var(--shadow-lg);
          animation: modalSlideIn 0.2s ease-out;
        }
        .modal-content.large { max-width:680px; max-height:90vh; overflow-y:auto; }
        .modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid var(--color-border); }
        .modal-header h3 { font-size:1.1rem; color:var(--color-text); display:flex; align-items:center; gap:.5rem; }
        .modal-close { background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:1.1rem; }
        .modal-body { padding:1.5rem; }
        .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; padding:1rem 1.5rem; border-top:1px solid var(--color-border); }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .form-group { display:flex; flex-direction:column; gap:.4rem; }
        .form-group.full-width { grid-column:1/-1; }
        .form-group label { font-size:.85rem; font-weight:600; color:var(--color-text-muted); }
        .form-group input,.form-group select,.form-group textarea { padding:.65rem .9rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.6rem; color:var(--color-text); font-size:.95rem; outline:none; transition:border-color .2s; }
        .form-group input:focus,.form-group select:focus,.form-group textarea:focus { border-color:var(--color-primary,#06b6d4); }
        .form-group textarea { resize:vertical; font-family:inherit; }
        .cancel-btn { padding:.65rem 1.25rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.6rem; color:var(--color-text); cursor:pointer; }
        .submit-btn { display:flex; align-items:center; gap:.5rem; padding:.65rem 1.5rem; background:var(--color-primary,#06b6d4); color:white; border:none; border-radius:.6rem; cursor:pointer; font-weight:600; }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
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