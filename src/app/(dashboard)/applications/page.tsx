'use client';
import { useEffect, useState } from 'react';
import { applicationsAPI, STATUS_CONFIG, TYPE_CONFIG, EMPTY_MANUAL, Application, AppStatus, AppType } from '@/lib';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 5;

// ── Pagination Component ──────────────────────────────────────────────────────
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
        Showing <strong>{from}–{to}</strong> of <strong>{totalItems}</strong> applications
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

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({
  appId,
  current,
  onChange,
}: {
  appId: string;
  current: AppStatus;
  onChange: (id: string, status: AppStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cfg = STATUS_CONFIG[current] || STATUS_CONFIG.pending;

  const handleSelect = async (status: AppStatus) => {
    if (status === current) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setOpen(false);
    await onChange(appId, status);
    setBusy(false);
  };

  return (
    <div className="status-dropdown-wrap" style={{ position: 'relative' }}>
      <button
        className="status-badge-btn"
        style={{ background: cfg.bg, color: cfg.text }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        disabled={busy}
        title="Click to change status"
      >
        {busy ? (
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '.75rem' }}></i>
        ) : (
          <>
            {cfg.label}{' '}
            <i className="fas fa-chevron-down" style={{ fontSize: '.65rem', marginLeft: '.3rem' }}></i>
          </>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div className="status-dropdown-menu">
            {(Object.entries(STATUS_CONFIG) as [AppStatus, typeof STATUS_CONFIG[AppStatus]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  className={`status-option ${key === current ? 'active' : ''}`}
                  style={{ '--bg': val.bg, '--tc': val.text } as any}
                  onClick={() => handleSelect(key)}
                >
                  <span className="status-dot" style={{ background: val.text }}></span>
                  {val.label}
                  {key === current && (
                    <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: '.75rem' }}></i>
                  )}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Add Manual Application Modal ──────────────────────────────────────────────
function AddManualModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (app: Application) => void;
}) {
  const [form, setForm] = useState(EMPTY_MANUAL);
  const [submitting, setSub] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Role / position title is required');
      return;
    }
    setSub(true);
    try {
      const app = await applicationsAPI.addManualApplication(form);
      toast.success('Application added!');
      onAdded(app);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add application');
    } finally {
      setSub(false);
    }
  };

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>
            <i className="fas fa-plus-circle" style={{ color: '#06b6d4' }}></i> Add Application
          </h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p className="modal-desc">
          Track a job or scholarship you applied for that isn't on the platform.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-form-grid">
            <div className="mfg-field full">
              <label>
                Role / Position Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Senior Software Engineer, Chevening Scholarship"
                autoFocus
              />
            </div>
            <div className="mfg-field">
              <label>Company / Organisation</label>
              <input
                value={form.company}
                onChange={set('company')}
                placeholder="e.g. Google, UK Government"
              />
            </div>
            <div className="mfg-field">
              <label>Location</label>
              <input
                value={form.location}
                onChange={set('location')}
                placeholder="e.g. Lagos, Remote, UK"
              />
            </div>
            <div className="mfg-field">
              <label>Type</label>
              <select value={form.job_type} onChange={set('job_type')}>
                <option value="">Select type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
                <option value="scholarship">Scholarship / Grant</option>
              </select>
            </div>
            <div className="mfg-field">
              <label>Application URL</label>
              <input
                type="url"
                value={form.apply_url}
                onChange={set('apply_url')}
                placeholder="https://…"
              />
            </div>
            <div className="mfg-field full">
              <label>
                Notes{' '}
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="Interview date, recruiter name, referral notes…"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Adding…
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Add Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | AppType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationsAPI.getApplications();
      setApplications(data);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: AppStatus) => {
    try {
      await applicationsAPI.updateApplicationStatus(appId, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
      toast.success(`Status updated to "${STATUS_CONFIG[newStatus].label}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAdded = (app: Application) => {
    // Normalise manual app from raw DB row
    const normalised: Application = {
      ...app,
      application_type: 'manual',
      title: app.manual_title || app.title || '',
      company: app.manual_company || app.company || '',
      location: app.manual_location || app.location || '',
      job_type: app.manual_job_type || app.job_type || '',
      apply_url: app.manual_apply_url || app.apply_url || '',
      notes: app.manual_notes || app.notes || '',
    };
    setApplications((prev) => [normalised, ...prev]);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'all' | AppType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const filtered =
    activeTab === 'all'
      ? applications
      : applications.filter((a) => a.application_type === activeTab);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedApps = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts = {
    all: applications.length,
    job: applications.filter((a) => a.application_type === 'job').length,
    scholarship: applications.filter((a) => a.application_type === 'scholarship').length,
    manual: applications.filter((a) => a.application_type === 'manual').length,
  };

  const statusCounts = {
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    withdrawn: applications.filter((a) => a.status === 'withdrawn').length,
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {showAddModal && <AddManualModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />}

      {/* Header */}
      <div className="apps-header">
        <div>
          <h1>
            <i className="fas fa-file-alt"></i> My Applications
          </h1>
          <p>Track every job and scholarship you've applied for</p>
        </div>
        <button className="add-app-btn" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i> Add Application
        </button>
      </div>

      {/* Stats row */}
      {applications.length > 0 && (
        <div className="apps-stats-row">
          {(Object.entries(statusCounts) as [AppStatus, number][]).map(([key, count]) => {
            const cfg = STATUS_CONFIG[key];
            return (
              <div key={key} className="apps-stat-chip" style={{ background: cfg.bg, color: cfg.text }}>
                <span className="apps-stat-count">{count}</span>
                <span className="apps-stat-label">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="apps-tabs">
        {(['all', 'job', 'scholarship', 'manual'] as const).map((tab) => (
          <button
            key={tab}
            className={`apps-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'all' ? (
              <>
                All <span className="tab-pill">{counts.all}</span>
              </>
            ) : (
              <>
                <i className={`fas ${TYPE_CONFIG[tab].icon}`}></i>
                {TYPE_CONFIG[tab].label}
                <span className="tab-pill">{counts[tab]}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="apps-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: 90, borderRadius: '.875rem' }}></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>No applications yet</h3>
          <p>
            {activeTab === 'all'
              ? "Start applying to jobs and scholarships — they'll appear here"
              : `No ${activeTab} applications yet`}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '1rem',
            }}
          >
            <Link href="/jobs" className="apply-btn" style={{ display: 'inline-flex', width: 'auto' }}>
              Browse Jobs
            </Link>
            <Link
              href="/scholarships"
              className="apply-btn"
              style={{
                display: 'inline-flex',
                width: 'auto',
                background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
              }}
            >
              Browse Scholarships
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="apply-btn"
              style={{
                display: 'inline-flex',
                width: 'auto',
                background: 'linear-gradient(135deg,#10b981,#047857)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-plus"></i> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="apps-list">
            {paginatedApps.map((app) => {
              const typeCfg = TYPE_CONFIG[app.application_type] || TYPE_CONFIG.manual;
              return (
                <div key={app.id} className="app-card">
                  {/* Left: icon */}
                  <div
                    className="app-card-icon"
                    style={{ background: `${typeCfg.color}18`, color: typeCfg.color }}
                  >
                    <i className={`fas ${typeCfg.icon}`}></i>
                  </div>

                  {/* Middle: info */}
                  <div className="app-card-body">
                    <div className="app-card-top">
                      <div>
                        <h3 className="app-title">
                          {app.apply_url ? (
                            <a href={app.apply_url} target="_blank" rel="noopener noreferrer">
                              {app.title}
                            </a>
                          ) : app.job_id ? (
                            <Link href={`/jobs/${app.job_id}`}>{app.title}</Link>
                          ) : app.scholarship_id ? (
                            <Link href={`/scholarships/${app.scholarship_id}`}>{app.title}</Link>
                          ) : (
                            app.title
                          )}
                        </h3>
                        <p className="app-company">{app.company || '—'}</p>
                      </div>

                      {/* Type badge */}
                      <span
                        className="app-type-badge"
                        style={{ color: typeCfg.color, background: `${typeCfg.color}18` }}
                      >
                        <i className={`fas ${typeCfg.icon}`}></i> {typeCfg.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="app-meta">
                      {app.location && (
                        <span>
                          <i className="fas fa-map-marker-alt"></i> {app.location}
                        </span>
                      )}
                      {app.job_type && (
                        <span>
                          <i className="fas fa-tag"></i> {app.job_type}
                        </span>
                      )}
                      {app.deadline && (
                        <span>
                          <i className="fas fa-calendar-alt"></i> Deadline:{' '}
                          {new Date(app.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {app.amount && (
                        <span>
                          <i className="fas fa-dollar-sign"></i> {app.amount}
                        </span>
                      )}
                      <span>
                        <i className="fas fa-clock"></i> Applied{' '}
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {app.notes && (
                      <p className="app-notes">
                        <i className="fas fa-sticky-note"></i> {app.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: status dropdown */}
                  <div className="app-card-right">
                    <StatusDropdown
                      appId={app.id}
                      current={app.status}
                      onChange={handleStatusChange}
                    />
                  </div>
                </div>
              );
            })}
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
        /* ── Page layout ─────────────────────────────────────────────────── */
        .apps-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .apps-header h1 {
          font-size: 1.75rem;
          color: var(--color-text);
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .apps-header h1 i {
          color: #06b6d4;
        }
        .apps-header p {
          color: var(--color-text-muted);
        }

        .add-app-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          color: white;
          border: none;
          border-radius: 0.875rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .add-app-btn:hover {
          opacity: 0.9;
        }

        /* ── Stats row ───────────────────────────────────────────────────── */
        .apps-stats-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .apps-stat-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          border-radius: 1rem;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .apps-stat-count {
          font-size: 1.1rem;
          font-weight: 800;
        }
        .apps-stat-label {
          font-weight: 600;
        }

        /* ── Tabs ────────────────────────────────────────────────────────── */
        .apps-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid var(--color-border);
          padding-bottom: 0.25rem;
        }
        .apps-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.1rem;
          border: none;
          background: none;
          color: var(--color-text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
          border-radius: 0.4rem 0.4rem 0 0;
        }
        .apps-tab:hover {
          color: var(--color-text);
        }
        .apps-tab.active {
          color: #06b6d4;
          border-bottom-color: #06b6d4;
          font-weight: 700;
        }
        .tab-pill {
          background: var(--color-border);
          color: var(--color-text-muted);
          border-radius: 1rem;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          min-width: 20px;
          text-align: center;
        }
        .apps-tab.active .tab-pill {
          background: #e0f9ff;
          color: #0891b2;
        }

        /* ── Cards ───────────────────────────────────────────────────────── */
        .apps-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          margin-bottom: 2rem;
        }
        .app-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 0.875rem;
          padding: 1.1rem 1.25rem;
          transition: all 0.2s;
        }
        .app-card:hover {
          border-color: #06b6d4;
          box-shadow: 0 4px 16px rgba(6, 182, 212, 0.08);
          transform: translateY(-1px);
        }
        .app-card-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .app-card-body {
          flex: 1;
          min-width: 0;
        }
        .app-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .app-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.15rem;
        }
        .app-title a {
          color: inherit;
          text-decoration: none;
        }
        .app-title a:hover {
          color: #06b6d4;
        }
        .app-company {
          font-size: 0.82rem;
          color: var(--color-text-muted);
        }
        .app-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: 1rem;
          font-size: 0.72rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .app-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--color-text-muted);
          margin-bottom: 0.35rem;
        }
        .app-meta i {
          color: #06b6d4;
          margin-right: 0.2rem;
        }
        .app-notes {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-style: italic;
          margin: 0;
        }
        .app-notes i {
          margin-right: 0.3rem;
          color: #f59e0b;
        }
        .app-card-right {
          flex-shrink: 0;
        }

        /* ── Status dropdown ─────────────────────────────────────────────── */
        .status-badge-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.85rem;
          border-radius: 1rem;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .status-badge-btn:hover:not(:disabled) {
          opacity: 0.8;
        }
        .status-badge-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.4rem);
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
          z-index: 100;
          min-width: 150px;
          overflow: hidden;
        }
        .status-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.65rem 1rem;
          background: none;
          border: none;
          color: var(--color-text);
          font-size: 0.85rem;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .status-option:hover {
          background: var(--color-bg);
        }
        .status-option.active {
          background: var(--bg, #f3f4f6);
          color: var(--tc, #374151);
          font-weight: 700;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Add manual modal ────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-card {
          background: var(--color-surface);
          border-radius: 1.25rem;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }
        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 0;
          margin-bottom: 0.5rem;
        }
        .modal-head h2 {
          font-size: 1.15rem;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .modal-close-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0.3rem 0.5rem;
          border-radius: 0.4rem;
          transition: all 0.2s;
        }
        .modal-close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .modal-desc {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          padding: 0 1.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        .modal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
          padding: 0 1.5rem;
        }
        .mfg-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .mfg-field.full {
          grid-column: 1 / -1;
        }
        .mfg-field label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .mfg-field input,
        .mfg-field select,
        .mfg-field textarea {
          padding: 0.65rem 0.9rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          border-radius: 0.6rem;
          color: var(--color-text);
          font-size: 0.9rem;
          font-family: inherit;
          transition: border-color 0.2s;
          outline: none;
        }
        .mfg-field input:focus,
        .mfg-field select:focus,
        .mfg-field textarea:focus {
          border-color: #06b6d4;
        }
        .mfg-field textarea {
          resize: vertical;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border);
          margin-top: 1.25rem;
        }
        .modal-cancel {
          padding: 0.65rem 1.25rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.6rem;
          color: var(--color-text);
          cursor: pointer;
          font-size: 0.9rem;
        }
        .modal-submit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          color: white;
          border: none;
          border-radius: 0.6rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
        }
        .modal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Pagination ──────────────────────────────────────────────────── */
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

        @media (max-width: 640px) {
          .modal-form-grid {
            grid-template-columns: 1fr;
          }
          .apps-header {
            flex-direction: column;
          }
          .app-card {
            flex-wrap: wrap;
          }
          .app-card-right {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}