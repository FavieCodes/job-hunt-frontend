'use client';
import { useEffect, useState } from 'react';
import { jobsAPI, userAPI } from '@/lib';
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
}

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

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, [filters]);

  // Listen for global search from navbar
  useEffect(() => {
    const handleGlobalSearch = (event: any) => {
      setFilters(prev => ({ ...prev, q: event.detail, page: 1 }));
    };
    window.addEventListener('globalSearch', handleGlobalSearch);
    return () => window.removeEventListener('globalSearch', handleGlobalSearch);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobsAPI.searchJobs(filters);
      setJobs(data.jobs || []);
      setTotalPages(data.pages || 1);
      setTotalJobs(data.total || 0);
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

  const handleApply = async (jobId: string, applyUrl: string) => {
    try {
      await userAPI.applyForJob(jobId);
      setAppliedJobs(prev => new Set([...prev, jobId]));
      toast.success('Application submitted!');
      // Open the application URL in a new tab
      if (applyUrl) {
        window.open(applyUrl, '_blank');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply');
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
        <h1><i className="fas fa-briefcase"></i> Find Your Dream Job</h1>
        <p>Discover {totalJobs}+ opportunities from top companies worldwide</p>
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
                <button
                  onClick={() => handleApply(job.id, job.apply_url)}
                  className={`apply-btn ${appliedJobs.has(job.id) ? 'applied' : ''}`}
                  disabled={appliedJobs.has(job.id)}
                >
                  {appliedJobs.has(job.id) ? (
                    <>
                      <i className="fas fa-check"></i> Applied
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Apply Now
                    </>
                  )}
                </button>
                <button className="save-btn">
                  <i className="far fa-bookmark"></i>
                </button>
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
        @media (max-width: 768px) {
          .jobs-grid {
            grid-template-columns: 1fr;
          }
          .filter-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}