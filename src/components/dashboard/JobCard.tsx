'use client';
import { useState } from 'react';
import Link from 'next/link';

interface JobCardProps {
  job: any;
  onApply: (jobId: string) => void;
  isApplied: boolean;
}

export default function JobCard({ job, onApply, isApplied }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const formatDate = (date: string) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="job-card">
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
          <span>Posted {formatDate(job.posted_at)}</span>
        </div>
      </div>

      <p className="job-description">
        {isExpanded ? job.description : `${job.description?.slice(0, 150)}...`}
        {job.description?.length > 150 && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="read-more">
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      <div className="job-card-footer">
        <button
          onClick={() => onApply(job.id)}
          className={`apply-btn ${isApplied ? 'applied' : ''}`}
          disabled={isApplied}
        >
          {isApplied ? (
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
  );
}