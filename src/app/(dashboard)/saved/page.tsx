'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

type ItemType = 'job' | 'scholarship';

interface SavedItem {
  id: string;
  title: string;
  // job fields
  company?: string;
  job_type?: string;
  city?: string;
  state?: string;
  country?: string;
  salary?: string;
  apply_url?: string;
  description?: string;
  // scholarship fields
  provider?: string;
  field?: string;
  deadline?: string;
  amount?: string;
  // common
  saved_at: string;
  item_type: ItemType;
}

const JOB_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'full-time':  { bg: '#d1fae5', text: '#065f46' },
  'part-time':  { bg: '#fef3c7', text: '#92400e' },
  'remote':     { bg: '#e0f2fe', text: '#0c4a6e' },
  'contract':   { bg: '#ede9fe', text: '#4c1d95' },
  'internship': { bg: '#fee2e2', text: '#7f1d1d' },
};

export default function SavedItemsPage() {
  const [items, setItems]       = useState<SavedItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'job' | 'scholarship'>('all');

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      // /user/saved now returns merged jobs + scholarships, each with item_type field
      const { data } = await api.get('/user/saved');
      setItems(Array.isArray(data) ? data : []);
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

  const displayed = activeTab === 'all'
    ? items
    : items.filter((i) => i.item_type === activeTab);

  const jobCount         = items.filter((i) => i.item_type === 'job').length;
  const scholarshipCount = items.filter((i) => i.item_type === 'scholarship').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="profile-header">
        <h1><i className="fas fa-bookmark"></i> Saved Items</h1>
        <p>Jobs and scholarships you've saved for later — {items.length} total</p>
      </div>

      {/* Tab bar */}
      <div className="saved-tabs">
        <button
          className={`saved-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All <span className="tab-count">{items.length}</span>
        </button>
        <button
          className={`saved-tab ${activeTab === 'job' ? 'active' : ''}`}
          onClick={() => setActiveTab('job')}
        >
          <i className="fas fa-briefcase"></i> Jobs <span className="tab-count">{jobCount}</span>
        </button>
        <button
          className={`saved-tab ${activeTab === 'scholarship' ? 'active' : ''}`}
          onClick={() => setActiveTab('scholarship')}
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
      ) : displayed.length === 0 ? (
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
        <div className="saved-grid">
          {displayed.map((item) =>
            item.item_type === 'job'
              ? <JobCard key={`job-${item.id}`} item={item} onRemove={handleRemoveJob} />
              : <ScholarshipCard key={`sch-${item.id}`} item={item} onRemove={handleRemoveScholarship} />
          )}
        </div>
      )}

      <style jsx>{`
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
        @media(max-width:640px) { .saved-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ item, onRemove }: { item: SavedItem; onRemove: (id: string) => void }) {
  const ts = JOB_TYPE_COLORS[item.job_type?.toLowerCase() || ''] || { bg: '#f3f4f6', text: '#374151' };
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
        <span className="sc-type" style={{ background: ts.bg, color: ts.text }}>
          {item.job_type || 'Full-time'}
        </span>
      </div>
      <div className="sc-meta">
        <span><i className="fas fa-map-marker-alt"></i> {item.city || item.state || item.country || 'Remote'}</span>
        {item.salary && <span><i className="fas fa-dollar-sign"></i> {item.salary}</span>}
        {item.saved_at && <span><i className="fas fa-clock"></i> Saved {new Date(item.saved_at).toLocaleDateString()}</span>}
      </div>
      {item.description && <p className="sc-desc">{item.description.slice(0, 120)}…</p>}
      <div className="sc-footer">
        <Link href={`/jobs/${item.id}`} className="sc-view-btn">
          <i className="fas fa-eye"></i> View Details
        </Link>
        {item.apply_url && (
          <a href={item.apply_url} target="_blank" rel="noopener noreferrer" className="sc-apply-btn">
            <i className="fas fa-paper-plane"></i> Apply Now
          </a>
        )}
        <button onClick={() => onRemove(item.id)} className="sc-remove-btn" title="Remove">
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
      <CardStyles />
    </div>
  );
}

// ── Scholarship Card ──────────────────────────────────────────────────────────

function ScholarshipCard({ item, onRemove }: { item: SavedItem; onRemove: (id: string) => void }) {
  const isDeadlineSoon = item.deadline
    ? (new Date(item.deadline).getTime() - Date.now()) < 14 * 24 * 3600 * 1000
    : false;

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
        {item.amount && (
          <span className="sc-type" style={{ background: '#f0fdf4', color: '#166534' }}>
            {item.amount}
          </span>
        )}
      </div>
      <div className="sc-meta">
        {item.country && <span><i className="fas fa-globe"></i> {item.country}</span>}
        {item.field && <span><i className="fas fa-book"></i> {item.field}</span>}
        {item.deadline && (
          <span style={{ color: isDeadlineSoon ? '#ef4444' : undefined }}>
            <i className="fas fa-calendar-alt"></i> Deadline: {new Date(item.deadline).toLocaleDateString()}
            {isDeadlineSoon && ' ⚠️'}
          </span>
        )}
        {item.saved_at && <span><i className="fas fa-clock"></i> Saved {new Date(item.saved_at).toLocaleDateString()}</span>}
      </div>
      {item.description && <p className="sc-desc">{item.description.slice(0, 120)}…</p>}
      <div className="sc-footer">
        <Link href={`/scholarships/${item.id}`} className="sc-view-btn sc-view-purple">
          <i className="fas fa-eye"></i> View Details
        </Link>
        {item.apply_url && (
          <a href={item.apply_url} target="_blank" rel="noopener noreferrer" className="sc-apply-btn">
            <i className="fas fa-paper-plane"></i> Apply Now
          </a>
        )}
        <button onClick={() => onRemove(item.id)} className="sc-remove-btn" title="Remove">
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
      <CardStyles />
    </div>
  );
}

// ── Shared card styles (injected once per card via jsx) ───────────────────────

function CardStyles() {
  return (
    <style jsx>{`
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
        display: flex; flex-wrap: wrap; gap: .6rem;
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
    `}</style>
  );
}