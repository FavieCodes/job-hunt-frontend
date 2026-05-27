'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data } = await api.get('/user/saved');
      setSavedJobs(data);
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId: string) => {
    try {
      await api.delete(`/user/saved/${jobId}`);
      setSavedJobs(savedJobs.filter((job: any) => job.id !== jobId));
    } catch (error) {
      console.error('Failed to remove saved job:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="profile-header">
        <h1><i className="fas fa-bookmark"></i> Saved Jobs</h1>
        <p>Jobs you've saved for later</p>
      </div>

      {loading ? (
        <div className="skeleton-card">Loading...</div>
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
        <div className="results-grid">
          {savedJobs.map((job: any) => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="company-logo">
                  {job.company?.[0] || 'J'}
                </div>
                <div className="job-info">
                  <h3 className="job-title">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p className="company-name">{job.company || 'Remote Company'}</p>
                </div>
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
              </div>
              <div className="job-card-footer">
                <Link href={`/jobs/${job.id}`} className="apply-btn">View Details</Link>
                <button onClick={() => handleRemove(job.id)} className="save-btn" style={{ color: '#ef4444' }}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}