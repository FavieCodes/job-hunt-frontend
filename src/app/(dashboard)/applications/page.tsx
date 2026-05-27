'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/user/applications');
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      reviewed: '#06b6d4',
      rejected: '#ef4444',
      accepted: '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="profile-header">
        <h1><i className="fas fa-file-alt"></i> My Applications</h1>
        <p>Track all the jobs you've applied for</p>
      </div>

      {loading ? (
        <div className="skeleton-card">Loading...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>No applications yet</h3>
          <p>Start applying to jobs and they'll appear here</p>
          <Link href="/jobs" className="apply-btn" style={{ display: 'inline-flex', width: 'auto', marginTop: '1rem' }}>
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app: any) => (
            <div key={app.id} className="job-card">
              <div className="job-card-header">
                <div className="company-logo">
                  {app.job?.company?.[0] || 'J'}
                </div>
                <div className="job-info">
                  <h3 className="job-title">
                    <Link href={`/jobs/${app.job_id}`}>{app.job?.title}</Link>
                  </h3>
                  <p className="company-name">{app.job?.company || 'Remote Company'}</p>
                </div>
                <span className="job-type" style={{ backgroundColor: getStatusColor(app.status) }}>
                  {app.status || 'Pending'}
                </span>
              </div>
              <div className="job-details">
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{app.job?.city || app.job?.state || app.job?.country || 'Remote'}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}