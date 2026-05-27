'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ScholarshipCard({ scholarship }: { scholarship: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { text: 'Rolling deadline', color: '#10b981' };
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: 'Closed', color: '#ef4444' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: '#f59e0b' };
    return { text: `${daysLeft} days left`, color: '#06b6d4' };
  };

  const deadlineStatus = getDeadlineStatus(scholarship.deadline);

  return (
    <div className="scholarship-card">
      <div className="scholarship-card-header">
        <div className="scholarship-icon">
          <i className="fas fa-graduation-cap"></i>
        </div>
        <div className="scholarship-info">
          <h3 className="scholarship-title">
            <Link href={`/scholarships/${scholarship.id}`}>{scholarship.title}</Link>
          </h3>
          <p className="provider-name">{scholarship.provider || 'Scholarship Provider'}</p>
        </div>
      </div>

      <div className="scholarship-details">
        {scholarship.country && (
          <div className="detail-item">
            <i className="fas fa-globe"></i>
            <span>{scholarship.country}</span>
          </div>
        )}
        {scholarship.field && (
          <div className="detail-item">
            <i className="fas fa-book"></i>
            <span>{scholarship.field}</span>
          </div>
        )}
        {scholarship.amount && (
          <div className="detail-item">
            <i className="fas fa-tag"></i>
            <span>{scholarship.amount}</span>
          </div>
        )}
        <div className="detail-item">
          <i className="fas fa-clock"></i>
          <span style={{ color: deadlineStatus.color }}>{deadlineStatus.text}</span>
        </div>
      </div>

      <p className="scholarship-description">
        {isExpanded ? scholarship.description : `${scholarship.description?.slice(0, 150)}...`}
        {scholarship.description?.length > 150 && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="read-more">
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      <div className="scholarship-card-footer">
        <a href={scholarship.apply_url} target="_blank" rel="noopener noreferrer" className="apply-btn">
          <i className="fas fa-external-link-alt"></i> Apply Now
        </a>
        <button className="save-btn">
          <i className="far fa-bookmark"></i>
        </button>
      </div>
    </div>
  );
}