'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { applicationsAPI } from '@/lib';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { ItemType, SavedItem } from '@/lib';

const ITEMS_PER_PAGE = 12;

const JOB_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'full-time':  { bg: '#d1fae5', text: '#065f46' },
  'part-time':  { bg: '#fef3c7', text: '#92400e' },
  'remote':     { bg: '#e0f2fe', text: '#0c4a6e' },
  'contract':   { bg: '#ede9fe', text: '#4c1d95' },
  'internship': { bg: '#fee2e2', text: '#7f1d1d' },
};

// ── Confirm Apply Modal for Jobs ──────────────────────────────────────────────
function ConfirmJobApplyModal({
  job,
  onConfirm,
  onCancel,
}: {
  job: { id: string; title: string; company: string };
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

// ── Confirm Apply Modal for Scholarships ──────────────────────────────────────
function ConfirmScholarshipApplyModal({
  scholarship,
  onConfirm,
  onCancel,
}: {
  scholarship: { id: string; title: string; provider: string };
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
          <h3><i className="fas fa-graduation-cap" style={{ color: '#10b981' }}></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close"><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">
          <div className="confirm-job-info">
            <div className="confirm-logo" style={{ background: 'linear-gradient(135deg,#10b981,#047857)' }}>
              {scholarship.provider?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <p className="confirm-job-title">{scholarship.title}</p>
              <p className="confirm-company">{scholarship.provider || 'Scholarship Provider'}</p>
            </div>
          </div>
          <p className="confirm-desc">You were redirected to the external application page.</p>
          <p className="confirm-question">
            <i className="fas fa-question-circle" style={{ color: '#10b981' }}></i>
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
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-wrapper">
      <p className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{totalItems}</strong> saved items
      </p>
      <div className="pagination">
        <button
          className="page-btn page-btn-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
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
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

export default function SavedItemsPage() {
  const [items, setItems]       = useState<SavedItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'job' | 'scholarship'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingJobApply, setPendingJobApply] = useState<{ id: string; title: string; company: string } | null>(null);
  const [pendingScholarshipApply, setPendingScholarshipApply] = useState<{ id: string; title: string; provider: string } | null>(null);

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/saved');
      setItems(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId: string) => {
    try {
      await api.delete(`/user/saved/jobs/${jobId}`);
      setItems((prev) => prev.filter((i) => !(i.id === jobId && i.item_type === 'job')));
      toast.success('Job removed from saved');
    } catch {
      toast.error('Failed to remove job');
    }
  };

  const handleRemoveScholarship = async (scholarshipId: string) => {
    try {
      await api.delete(`/user/saved/scholarships/${scholarshipId}`);
      setItems((prev) => prev.filter((i) => !(i.id === scholarshipId && i.item_type === 'scholarship')));
      toast.success('Scholarship removed from saved');
    } catch {
      toast.error('Failed to remove scholarship');
    }
  };

  const handleJobApplyClick = (job: { id: string; title: string; company: string; apply_url?: string }) => {
    if (job.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setPendingJobApply({ id: job.id, title: job.title, company: job.company }), 400);
  };

  const handleJobConfirmApplied = async () => {
    if (!pendingJobApply) return;
    try {
      // Record the application
      await applicationsAPI.applyForJob(pendingJobApply.id);
      
      // Remove the job from saved items
      await api.delete(`/user/saved/jobs/${pendingJobApply.id}`);
      
      // Update the local state to remove the item
      setItems((prev) => prev.filter((i) => !(i.id === pendingJobApply.id && i.item_type === 'job')));
      
      toast.success('Application recorded! Job removed from saved items 🎉');
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        // If already applied, still try to remove from saved
        try {
          await api.delete(`/user/saved/jobs/${pendingJobApply.id}`);
          setItems((prev) => prev.filter((i) => !(i.id === pendingJobApply.id && i.item_type === 'job')));
          toast.success('Already applied! Job removed from saved items');
        } catch {
          toast.success('Already applied!');
        }
      } else {
        toast.error(msg || 'Failed to record application');
      }
    } finally {
      setPendingJobApply(null);
    }
  };

  const handleScholarshipApplyClick = (scholarship: { id: string; title: string; provider: string; apply_url?: string }) => {
    if (scholarship.apply_url) {
      window.open(scholarship.apply_url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setPendingScholarshipApply({ id: scholarship.id, title: scholarship.title, provider: scholarship.provider }), 400);
  };

  const handleScholarshipConfirmApplied = async () => {
    if (!pendingScholarshipApply) return;
    try {
      // Record the application
      await applicationsAPI.applyForScholarship(pendingScholarshipApply.id);
      
      // Remove the scholarship from saved items
      await api.delete(`/user/saved/scholarships/${pendingScholarshipApply.id}`);
      
      // Update the local state to remove the item
      setItems((prev) => prev.filter((i) => !(i.id === pendingScholarshipApply.id && i.item_type === 'scholarship')));
      
      toast.success('Application recorded! Scholarship removed from saved items 🎉');
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        // If already applied, still try to remove from saved
        try {
          await api.delete(`/user/saved/scholarships/${pendingScholarshipApply.id}`);
          setItems((prev) => prev.filter((i) => !(i.id === pendingScholarshipApply.id && i.item_type === 'scholarship')));
          toast.success('Already applied! Scholarship removed from saved items');
        } catch {
          toast.success('Already applied!');
        }
      } else {
        toast.error(msg || 'Failed to record application');
      }
    } finally {
      setPendingScholarshipApply(null);
    }
  };

  const filtered = activeTab === 'all'
    ? items
    : items.filter((i) => i.item_type === activeTab);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const jobCount         = items.filter((i) => i.item_type === 'job').length;
  const scholarshipCount = items.filter((i) => i.item_type === 'scholarship').length;

  const handleTabChange = (tab: 'all' | 'job' | 'scholarship') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Modals */}
      {pendingJobApply && (
        <ConfirmJobApplyModal
          job={pendingJobApply}
          onConfirm={handleJobConfirmApplied}
          onCancel={() => setPendingJobApply(null)}
        />
      )}
      {pendingScholarshipApply && (
        <ConfirmScholarshipApplyModal
          scholarship={pendingScholarshipApply}
          onConfirm={handleScholarshipConfirmApplied}
          onCancel={() => setPendingScholarshipApply(null)}
        />
      )}

      <div className="profile-header">
        <h1><i className="fas fa-bookmark"></i> Saved Items</h1>
        <p>Jobs and scholarships you've saved for later — {items.length} total</p>
      </div>

      {/* Tab bar */}
      <div className="saved-tabs">
        <button
          className={`saved-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All <span className="tab-count">{items.length}</span>
        </button>
        <button
          className={`saved-tab ${activeTab === 'job' ? 'active' : ''}`}
          onClick={() => handleTabChange('job')}
        >
          <i className="fas fa-briefcase"></i> Jobs <span className="tab-count">{jobCount}</span>
        </button>
        <button
          className={`saved-tab ${activeTab === 'scholarship' ? 'active' : ''}`}
          onClick={() => handleTabChange('scholarship')}
        >
          <i className="fas fa-graduation-cap"></i> Scholarships <span className="tab-count">{scholarshipCount}</span>
        </button>
      </div>

      {loading ? (
        <div className="saved-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: '200px', borderRadius: '1rem' }}></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className={`fas ${activeTab === 'scholarship' ? 'fa-graduation-cap' : 'fa-bookmark'}`}></i>
          <h3>No saved {activeTab === 'all' ? 'items' : activeTab === 'job' ? 'jobs' : 'scholarships'}</h3>
          <p>
            {activeTab === 'scholarship'
              ? 'Save scholarships you\'re interested in and they\'ll appear here'
              : 'Save jobs you\'re interested in and they\'ll appear here'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link href="/jobs" className="apply-btn" style={{ display: 'inline-flex', width: 'auto' }}>
              Browse Jobs
            </Link>
            <Link href="/scholarships" className="apply-btn" style={{ display: 'inline-flex', width: 'auto', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
              Browse Scholarships
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="saved-grid">
            {paginatedItems.map((item) =>
              item.item_type === 'job'
                ? <JobCard key={`job-${item.id}`} item={item} onRemove={handleRemoveJob} onApply={handleJobApplyClick} />
                : <ScholarshipCard key={`sch-${item.id}`} item={item} onRemove={handleRemoveScholarship} onApply={handleScholarshipApplyClick} />
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <style jsx global>{`
        .saved-tabs {
          display: flex;
          gap: .5rem;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid var(--color-border);
          padding-bottom: .25rem;
        }
        .saved-tab {
          display: flex;
          align-items: center;
          gap: .4rem;
          padding: .55rem 1.1rem;
          border: none;
          background: none;
          color: var(--color-text-muted);
          font-size: .9rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -2px;
          transition: all .2s;
          border-radius: .4rem .4rem 0 0;
        }
        .saved-tab:hover { color: var(--color-text); }
        .saved-tab.active {
          color: #06b6d4;
          border-bottom-color: #06b6d4;
          font-weight: 700;
        }
        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--color-border);
          color: var(--color-text-muted);
          border-radius: 1rem;
          font-size: .72rem;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          padding: 0 .4rem;
        }
        .saved-tab.active .tab-count { background: #e0f9ff; color: #0891b2; }

        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .saved-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: .85rem;
          transition: all .2s;
          position: relative;
        }
        .saved-card:hover {
          border-color: #06b6d4;
          box-shadow: 0 6px 20px rgba(6,182,212,.1);
          transform: translateY(-2px);
        }
        .sc-type-chip {
          position: absolute;
          top: 1rem; right: 1rem;
          display: inline-flex;
          align-items: center;
          gap: .3rem;
          font-size: .7rem;
          font-weight: 700;
          padding: .2rem .55rem;
          border-radius: 1rem;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .job-chip         { background: #dbeafe; color: #1e40af; }
        .scholarship-chip { background: #ede9fe; color: #6d28d9; }

        .sc-header { display: flex; align-items: flex-start; gap: 1rem; }
        .sc-logo {
          width: 48px; height: 48px; flex-shrink: 0;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          border-radius: .75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 700; color: white;
        }
        .sc-logo-purple { background: linear-gradient(135deg,#8b5cf6,#6d28d9); }
        .sc-title-block { flex: 1; min-width: 0; padding-right: 4rem; }
        .sc-title {
          font-size: 1rem; font-weight: 700;
          color: var(--color-text); line-height: 1.3;
          margin-bottom: .2rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sc-company { font-size: .82rem; color: var(--color-text-muted); }
        .sc-type {
          padding: .2rem .65rem; border-radius: 1rem;
          font-size: .72rem; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
          text-transform: capitalize;
        }
        .sc-meta {
          display: flex; flex-wrap: wrap; gap: .6rem; align-items: center;
          font-size: .78rem; color: var(--color-text-muted);
        }
        .sc-meta i { margin-right: .25rem; color: #06b6d4; }
        .sc-desc {
          font-size: .85rem; color: var(--color-text-muted); line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sc-footer {
          display: flex; gap: .75rem; align-items: center;
          padding-top: .75rem;
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .sc-view-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .55rem 1.1rem;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          color: white; border-radius: .6rem;
          text-decoration: none; font-size: .85rem; font-weight: 600;
          transition: opacity .2s;
        }
        .sc-view-btn:hover { opacity: .9; }
        .sc-view-purple { background: linear-gradient(135deg,#8b5cf6,#6d28d9); }
        .sc-apply-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .55rem 1.1rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          color: var(--color-text);
          border-radius: .6rem;
          text-decoration: none; font-size: .85rem;
          transition: all .2s;
        }
        .sc-apply-btn:hover { border-color: #06b6d4; color: #06b6d4; }
        .sc-remove-btn {
          margin-left: auto;
          background: none; border: none;
          color: var(--color-text-muted);
          cursor: pointer; font-size: .95rem; padding: .4rem;
          border-radius: .5rem; transition: all .2s;
        }
        .sc-remove-btn:hover { background: #fee2e2; color: #ef4444; }

        /* Pagination Styles */
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

        /* Global Modal Styles */
        .fixed-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .fixed-modal-content {
          background: var(--color-surface);
          border-radius: 1rem;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        .fixed-modal-content.confirm-modal {
          max-width: 420px;
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
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 1.1rem;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .confirm-job-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-bg);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .confirm-logo {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }
        .confirm-job-title {
          font-weight: 700;
          color: var(--color-text);
          font-size: .95rem;
          margin-bottom: .15rem;
        }
        .confirm-company {
          color: var(--color-text-muted);
          font-size: .82rem;
        }
        .confirm-desc {
          color: var(--color-text-muted);
          font-size: .875rem;
          margin-bottom: .75rem;
        }
        .confirm-question {
          font-weight: 600;
          color: var(--color-text);
          font-size: .95rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: .4rem;
        }
        .confirm-actions {
          display: flex;
          gap: .75rem;
        }
        .btn-not-yet {
          flex: 1;
          padding: .7rem;
          border: 1.5px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          border-radius: .6rem;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          transition: border-color .2s;
        }
        .btn-not-yet:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        .btn-yes-applied {
          flex: 1;
          padding: .7rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: .6rem;
          cursor: pointer;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          transition: background .2s;
        }
        .btn-yes-applied:hover {
          background: #059669;
        }

        @media(max-width:640px) { 
          .saved-grid { grid-template-columns: 1fr; }
          .saved-tabs { overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ item, onRemove, onApply }: { 
  item: SavedItem; 
  onRemove: (id: string) => void;
  onApply: (job: { id: string; title: string; company: string; apply_url?: string }) => void;
}) {
  const ts = JOB_TYPE_COLORS[item.job_type?.toLowerCase() || ''] || { bg: '#f3f4f6', text: '#374151' };
  
  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onApply({
      id: item.id,
      title: item.title,
      company: item.company || 'Company',
      apply_url: item.apply_url
    });
  };

  return (
    <div className="saved-card">
      <div className="sc-type-chip job-chip">
        <i className="fas fa-briefcase"></i> Job
      </div>
      <div className="sc-header">
        <div className="sc-logo">{item.company?.[0]?.toUpperCase() || 'J'}</div>
        <div className="sc-title-block">
          <h3 className="sc-title">{item.title}</h3>
          <p className="sc-company">{item.company || 'Company'}</p>
        </div>
      </div>
      <div className="sc-meta">
        <span className="sc-type" style={{ background: ts.bg, color: ts.text }}>
          {item.job_type || 'Full-time'}
        </span>
        <span><i className="fas fa-map-marker-alt"></i> {item.city || item.state || item.country || 'Remote'}</span>
        {item.salary && <span><i className="fas fa-dollar-sign"></i> {item.salary}</span>}
        <span><i className="fas fa-clock"></i> Saved {new Date(item.saved_at).toLocaleDateString()}</span>
      </div>
      {item.description && <p className="sc-desc">{item.description.slice(0, 120)}…</p>}
      <div className="sc-footer">
        <Link href={`/jobs/${item.id}`} className="sc-view-btn">
          <i className="fas fa-eye"></i> View Details
        </Link>
        {item.apply_url && (
          <button onClick={handleApplyClick} className="sc-apply-btn">
            <i className="fas fa-paper-plane"></i> Apply Now
          </button>
        )}
        <button onClick={() => onRemove(item.id)} className="sc-remove-btn" title="Remove">
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  );
}

// ── Scholarship Card ──────────────────────────────────────────────────────────

function ScholarshipCard({ item, onRemove, onApply }: { 
  item: SavedItem; 
  onRemove: (id: string) => void;
  onApply: (scholarship: { id: string; title: string; provider: string; apply_url?: string }) => void;
}) {
  const isDeadlineSoon = item.deadline
    ? (new Date(item.deadline).getTime() - Date.now()) < 14 * 24 * 3600 * 1000
    : false;

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onApply({
      id: item.id,
      title: item.title,
      provider: item.provider || 'Scholarship Provider',
      apply_url: item.apply_url
    });
  };

  return (
    <div className="saved-card">
      <div className="sc-type-chip scholarship-chip">
        <i className="fas fa-graduation-cap"></i> Scholarship
      </div>
      <div className="sc-header">
        <div className="sc-logo sc-logo-purple">{item.provider?.[0]?.toUpperCase() || item.title?.[0]?.toUpperCase() || 'S'}</div>
        <div className="sc-title-block">
          <h3 className="sc-title">{item.title}</h3>
          <p className="sc-company">{item.provider || 'Scholarship Provider'}</p>
        </div>
      </div>
      <div className="sc-meta">
        {item.amount && (
          <span className="sc-type" style={{ background: '#f0fdf4', color: '#166534' }}>
            {item.amount}
          </span>
        )}
        {item.country && <span><i className="fas fa-globe"></i> {item.country}</span>}
        {item.field && <span><i className="fas fa-book"></i> {item.field}</span>}
        {item.deadline && (
          <span style={{ color: isDeadlineSoon ? '#ef4444' : undefined }}>
            <i className="fas fa-calendar-alt"></i> Deadline: {new Date(item.deadline).toLocaleDateString()}
            {isDeadlineSoon && ' ⚠️'}
          </span>
        )}
        <span><i className="fas fa-clock"></i> Saved {new Date(item.saved_at).toLocaleDateString()}</span>
      </div>
      {item.description && <p className="sc-desc">{item.description.slice(0, 120)}…</p>}
      <div className="sc-footer">
        <Link href={`/scholarships/${item.id}`} className="sc-view-btn sc-view-purple">
          <i className="fas fa-eye"></i> View Details
        </Link>
        {item.apply_url && (
          <button onClick={handleApplyClick} className="sc-apply-btn">
            <i className="fas fa-paper-plane"></i> Apply Now
          </button>
        )}
        <button onClick={() => onRemove(item.id)} className="sc-remove-btn" title="Remove">
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  );
}