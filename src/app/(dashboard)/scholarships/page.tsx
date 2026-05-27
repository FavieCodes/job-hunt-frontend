'use client';
import { useEffect, useState } from 'react';
import { scholarshipAPI } from '@/lib/api';
import Link from 'next/link';

interface Scholarship {
  id: string;
  title: string;
  provider: string;
  description: string;
  country: string;
  field: string;
  deadline: string;
  amount: string;
  apply_url: string;
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: '',
    field: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchScholarships();
  }, [filters]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const data = await scholarshipAPI.searchScholarships(filters);
      setScholarships(data.scholarships || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { text: 'Rolling deadline', color: '#10b981' };
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { text: 'Closed', color: '#ef4444' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: '#f59e0b' };
    return { text: `${daysLeft} days left`, color: '#06b6d4' };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <h1><i className="fas fa-graduation-cap"></i> Scholarships & Grants</h1>
        <p>Discover funding opportunities worldwide</p>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <select
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value, page: 1 })}
          >
            <option value="">All Countries</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Germany">Germany</option>
            <option value="Australia">Australia</option>
          </select>
          
          <input
            type="text"
            placeholder="Search by field of study..."
            value={filters.field}
            onChange={(e) => setFilters({ ...filters, field: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {loading ? (
        <div className="scholarships-grid">
          {[1,2,3,4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      ) : scholarships.length > 0 ? (
        <div className="scholarships-grid">
          {scholarships.map((scholarship) => {
            const deadline = getDeadlineStatus(scholarship.deadline);
            return (
              <div key={scholarship.id} className="scholarship-card">
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
                    <span style={{ color: deadline.color }}>{deadline.text}</span>
                  </div>
                </div>

                <p className="scholarship-description">
                  {scholarship.description?.slice(0, 120)}...
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
          })}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No scholarships found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="page-btn"
          >
            Previous
          </button>
          <span>Page {filters.page} of {totalPages}</span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === totalPages}
            className="page-btn"
          >
            Next
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
        .filters-container {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .filter-group {
          display: flex;
          gap: 1rem;
        }
        .filter-group select, .filter-group input {
          flex: 1;
          padding: 0.75rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          color: var(--color-text);
        }
        .scholarships-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 768px) {
          .scholarships-grid {
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