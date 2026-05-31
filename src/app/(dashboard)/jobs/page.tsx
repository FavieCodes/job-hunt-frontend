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
  title: '',
  company: '',
  description: '',
  country: '',
  city: '',
  job_type: 'full-time',
  salary: '',
  apply_url: '',
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
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
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

// Add Job Modal Component
function AddJobModal({
  addForm,
  setAddForm,
  submitting,
  onClose,
  onSubmit,
}: {
  addForm: AddJobForm;
  setAddForm: (form: AddJobForm) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed-modal-overlay" onClick={onClose}>
      <div className="fixed-modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-plus-circle"></i> Add New Job</h3>
          <button onClick={onClose} className="modal-close"><i className="fas fa-times"></i></button>
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
              <textarea 
                placeholder="Job description…" 
                value={addForm.description} 
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} 
                rows={4} 
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={onSubmit} disabled={submitting} className="submit-btn">
            {submitting ? <><i className="fas fa-spinner fa-spin"></i> Adding…</> : <><i className="fas fa-plus"></i> Add Job</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', job_type: '', q: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddJobForm>(emptyForm);
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
    'full-time': '#8fe3c7ff',
    'part-time': '#c0baafff',
    'remote': '#aadfe8ff',
    'contract': '#a88beaff',
    'internship': '#ef4444',
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

      {/* Add Job Modal */}
      {showAddModal && (
        <AddJobModal
          addForm={addForm}
          setAddForm={setAddForm}
          submitting={submitting}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddJob}
        />
      )}
    </div>
  );
}