'use client';
import { useEffect, useState } from 'react';
import { jobsAPI, userAPI } from '@/lib';
import { adminJobsAPI } from '@/lib/jobs';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  applicant_count?: number;
  saved_count?: number;
}

interface AddJobForm {
  title: string;
  company: string;
  description: string;
  country: string;
  city: string;
  job_type: string;
  salary: string;
  apply_url: string;
}

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: '',
    job_type: '',
    q: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddJobForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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

  // Listen for global search from navbar
  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      setFilters(prev => ({ ...prev, q: event.detail, page: 1 }));
    };
    window.addEventListener('globalSearch', handleGlobalSearch);
    return () => window.removeEventListener('globalSearch', handleGlobalSearch);
  }, []);

  const isAdmin = user?.role === 'admin';

  const fetchJobs = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Use admin endpoint which includes engagement counts
        const data = await adminJobsAPI.getAllJobs({
          page: filters.page,
          limit: 20,
          search: filters.q,
        });
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      } else {
        const data = await jobsAPI.searchJobs(filters);
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const applications = await userAPI.getApplications();
      setAppliedJobs(new Set(applications.map((app: any) => app.job_id)));
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const saved = await userAPI.getSavedJobs();
      setSavedJobs(new Set(saved.map((j: any) => j.id)));
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    }
  };

  const handleApply = async (jobId: string, applyUrl: string) => {
    try {
      await userAPI.applyForJob(jobId);
      setAppliedJobs(prev => new Set([...prev, jobId]));
      toast.success('Application submitted!');
      if (applyUrl) window.open(applyUrl, '_blank');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply');
    }
  };

  const handleSave = async (jobId: string) => {
    try {
      if (savedJobs.has(jobId)) {
        await api.delete(`/user/saved/${jobId}`);
        setSavedJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
        toast.success('Job removed from saved');
      } else {
        await api.post('/user/saved', { job_id: jobId });
        setSavedJobs(prev => new Set([...prev, jobId]));
        toast.success('Job saved!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save job');
    }
  };

  const handleAddJob = async () => {
    if (!addForm.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    setSubmitting(true);
    try {
      await adminJobsAPI.createJob(addForm);
      toast.success('Job added successfully!');
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add job');
    } finally {
      setSubmitting(false);
    }
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': '#10b981',
      'part-time': '#f59e0b',
      'remote': '#06b6d4',
      'contract': '#8b5cf6',
      'internship': '#ef4444'
    };
    return colors[type?.toLowerCase()] || '#6b7280';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <div>
            <h1><i className="fas fa-briefcase"></i> {isAdmin ? 'Manage Jobs' : 'Find Your Dream Job'}</h1>
            <p>{isAdmin ? `${totalJobs} total jobs on the platform` : `Discover ${totalJobs}+ opportunities from top companies worldwide`}</p>
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
        )}
      </div>

      {/* Results Count */}
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
                <div className="company-logo">
                  {job.company?.[0] || 'J'}
                </div>
                <div className="job-info">
                  <h3 className="job-title">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p className="company-name">{job.company || 'Company'}</p>
                </div>
                <span className="job-type" style={{ backgroundColor: getJobTypeColor(job.job_type) }}>
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
                  <span>Posted {new Date(job.posted_at).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="job-description">
                {job.description?.slice(0, 150)}...
              </p>

              <div className="job-card-footer">
                {isAdmin ? (
                  /* Admin view: show engagement counts */
                  <div className="engagement-stats">
                    <span className="engagement-badge applied-badge">
                      <i className="fas fa-paper-plane"></i>
                      {job.applicant_count ?? 0} applied
                    </span>
                    <span className="engagement-badge saved-badge">
                      <i className="fas fa-bookmark"></i>
                      {job.saved_count ?? 0} saved
                    </span>
                  </div>
                ) : (
                  /* User view: apply + save buttons */
                  <>
                    <button
                      onClick={() => handleApply(job.id, job.apply_url)}
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
                      className={`save-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                      onClick={() => handleSave(job.id)}
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

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add New Job</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Title <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Backend Engineer"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={addForm.company}
                    onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Nigeria"
                    value={addForm.country}
                    onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Job Type</label>
                  <select
                    value={addForm.job_type}
                    onChange={(e) => setAddForm({ ...addForm, job_type: e.target.value })}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="remote">Remote</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Salary</label>
                  <input
                    type="text"
                    placeholder="e.g. $80,000 - $100,000"
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Apply URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com/apply"
                    value={addForm.apply_url}
                    onChange={(e) => setAddForm({ ...addForm, apply_url: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    placeholder="Job description..."
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddJob} disabled={submitting} className="submit-btn">
                {submitting ? <><i className="fas fa-spinner fa-spin"></i> Adding...</> : <><i className="fas fa-plus"></i> Add Job</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--color-primary, #06b6d4);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .add-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-header h1 {
          font-size: 2rem;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }
        .page-header p {
          color: var(--color-text-muted);
        }
        .filters-container {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .search-input-large {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
        }
        .search-input-large i {
          color: var(--color-text-muted);
        }
        .search-input-large input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--color-text);
          font-size: 1rem;
        }
        .filter-group {
          display: flex;
          gap: 1rem;
        }
        .filter-group select {
          flex: 1;
          padding: 0.75rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          color: var(--color-text);
          cursor: pointer;
        }
        .results-count {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          color: var(--color-text-muted);
        }
        .clear-filters {
          background: none;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
        }
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .engagement-stats {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex: 1;
        }
        .engagement-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .applied-badge {
          background: #dbeafe;
          color: #1e40af;
        }
        .saved-badge {
          background: #ede9fe;
          color: #6d28d9;
        }
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: var(--color-surface);
          border-radius: 1rem;
          width: 90%;
          max-width: 400px;
          box-shadow: var(--shadow-lg);
        }
        .modal-content.large {
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
        }
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
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0.25rem;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .required { color: #ef4444; }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.65rem 0.9rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.6rem;
          color: var(--color-text);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--color-primary, #06b6d4);
        }
        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }
        .cancel-btn {
          padding: 0.65rem 1.25rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.6rem;
          color: var(--color-text);
          cursor: pointer;
          font-size: 0.95rem;
        }
        .submit-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.5rem;
          background: var(--color-primary, #06b6d4);
          color: white;
          border: none;
          border-radius: 0.6rem;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .jobs-grid { grid-template-columns: 1fr; }
          .filter-group { flex-direction: column; }
          .form-grid { grid-template-columns: 1fr; }
          .header-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}