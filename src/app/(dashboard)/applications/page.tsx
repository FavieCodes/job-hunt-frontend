'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { userAPI } from '@/lib';
import Link from 'next/link';
import toast from 'react-hot-toast';

type AppStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn';
type AppType   = 'job' | 'scholarship' | 'manual';

interface Application {
  id: string;
  job_id?: string;
  scholarship_id?: string;
  application_type: AppType;
  status: AppStatus;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  salary?: string;
  apply_url?: string;
  deadline?: string;
  amount?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Raw DB fields for manual applications
  manual_title?: string;
  manual_company?: string;
  manual_location?: string;
  manual_job_type?: string;
  manual_apply_url?: string;
  manual_notes?: string;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   bg: '#fef3c7', text: '#92400e' },
  reviewed:  { label: 'Reviewed',  bg: '#dbeafe', text: '#1e40af' },
  accepted:  { label: 'Accepted',  bg: '#d1fae5', text: '#065f46' },
  rejected:  { label: 'Rejected',  bg: '#fee2e2', text: '#7f1d1d' },
  withdrawn: { label: 'Withdrawn', bg: '#f3f4f6', text: '#374151' },
};

const TYPE_CONFIG: Record<AppType, { label: string; icon: string; color: string }> = {
  job:         { label: 'Job',         icon: 'fa-briefcase',      color: '#1e40af' },
  scholarship: { label: 'Scholarship', icon: 'fa-graduation-cap', color: '#6d28d9' },
  manual:      { label: 'External',    icon: 'fa-external-link-alt', color: '#065f46' },
};

const EMPTY_MANUAL = {
  title: '', company: '', apply_url: '',
  location: '', job_type: '', notes: '',
};

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
  const [open, setOpen]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const cfg                 = STATUS_CONFIG[current] || STATUS_CONFIG.pending;

  const handleSelect = async (status: AppStatus) => {
    if (status === current) { setOpen(false); return; }
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
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        disabled={busy}
        title="Click to change status"
      >
        {busy
          ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '.75rem' }}></i>
          : <>{cfg.label} <i className="fas fa-chevron-down" style={{ fontSize: '.65rem', marginLeft: '.3rem' }}></i></>
        }
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div className="status-dropdown-menu">
            {(Object.entries(STATUS_CONFIG) as [AppStatus, typeof STATUS_CONFIG[AppStatus]][]).map(([key, val]) => (
              <button
                key={key}
                className={`status-option ${key === current ? 'active' : ''}`}
                style={{ '--bg': val.bg, '--tc': val.text } as any}
                onClick={() => handleSelect(key)}
              >
                <span className="status-dot" style={{ background: val.text }}></span>
                {val.label}
                {key === current && <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: '.75rem' }}></i>}
              </button>
            ))}
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
  const [form, setForm]       = useState(EMPTY_MANUAL);
  const [submitting, setSub]  = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Role / position title is required'); return; }
    setSub(true);
    try {
      const app = await userAPI.addManualApplication(form);
      toast.success('Application added!');
      onAdded(app as any);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add application');
    } finally {
      setSub(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2><i className="fas fa-plus-circle" style={{ color: '#06b6d4' }}></i> Add Application</h2>
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
              <label>Role / Position Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                value={form.title} onChange={set('title')}
                placeholder="e.g. Senior Software Engineer, Chevening Scholarship"
                autoFocus
              />
            </div>
            <div className="mfg-field">
              <label>Company / Organisation</label>
              <input value={form.company} onChange={set('company')} placeholder="e.g. Google, UK Government" />
            </div>
            <div className="mfg-field">
              <label>Location</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. Lagos, Remote, UK" />
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
              <input type="url" value={form.apply_url} onChange={set('apply_url')} placeholder="https://…" />
            </div>
            <div className="mfg-field full">
              <label>Notes <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.notes} onChange={set('notes')} rows={3}
                placeholder="Interview date, recruiter name, referral notes…"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-submit" disabled={submitting}>
              {submitting
                ? <><i className="fas fa-spinner fa-spin"></i> Adding…</>
                : <><i className="fas fa-plus"></i> Add Application</>}
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
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<'all' | AppType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/applications');
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: AppStatus) => {
    try {
      await userAPI.updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a)
      );
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
      title:   app.manual_title   || app.title   || '',
      company: app.manual_company || app.company  || '',
      location:app.manual_location|| app.location || '',
      job_type:app.manual_job_type|| app.job_type || '',
      apply_url:app.manual_apply_url||app.apply_url||'',
      notes:   app.manual_notes  || app.notes    || '',
    } as any;
    setApplications((prev) => [normalised, ...prev]);
  };

  const displayed = activeTab === 'all'
    ? applications
    : applications.filter((a) => a.application_type === activeTab);

  const counts = {
    all:         applications.length,
    job:         applications.filter((a) => a.application_type === 'job').length,
    scholarship: applications.filter((a) => a.application_type === 'scholarship').length,
    manual:      applications.filter((a) => a.application_type === 'manual').length,
  };

  const statusCounts = {
    pending:   applications.filter((a) => a.status === 'pending').length,
    reviewed:  applications.filter((a) => a.status === 'reviewed').length,
    accepted:  applications.filter((a) => a.status === 'accepted').length,
    rejected:  applications.filter((a) => a.status === 'rejected').length,
    withdrawn: applications.filter((a) => a.status === 'withdrawn').length,
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {showAddModal && (
        <AddManualModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Header */}
      <div className="apps-header">
        <div>
          <h1><i className="fas fa-file-alt"></i> My Applications</h1>
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
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? (
              <>All <span className="tab-pill">{counts.all}</span></>
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
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>No applications yet</h3>
          <p>
            {activeTab === 'all'
              ? 'Start applying to jobs and scholarships — they\'ll appear here'
              : `No ${activeTab} applications yet`}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link href="/jobs" className="apply-btn" style={{ display: 'inline-flex', width: 'auto' }}>
              Browse Jobs
            </Link>
            <Link href="/scholarships" className="apply-btn" style={{ display: 'inline-flex', width: 'auto', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
              Browse Scholarships
            </Link>
            <button onClick={() => setShowAddModal(true)} className="apply-btn" style={{ display: 'inline-flex', width: 'auto', background: 'linear-gradient(135deg,#10b981,#047857)', border: 'none', cursor: 'pointer' }}>
              <i className="fas fa-plus"></i> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="apps-list">
          {displayed.map((app) => {
            const typeCfg = TYPE_CONFIG[app.application_type] || TYPE_CONFIG.manual;
            return (
              <div key={app.id} className="app-card">
                {/* Left: icon */}
                <div className="app-card-icon" style={{ background: `${typeCfg.color}18`, color: typeCfg.color }}>
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
                    <span className="app-type-badge" style={{ color: typeCfg.color, background: `${typeCfg.color}18` }}>
                      <i className={`fas ${typeCfg.icon}`}></i> {typeCfg.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="app-meta">
                    {app.location && (
                      <span><i className="fas fa-map-marker-alt"></i> {app.location}</span>
                    )}
                    {app.job_type && (
                      <span><i className="fas fa-tag"></i> {app.job_type}</span>
                    )}
                    {app.deadline && (
                      <span><i className="fas fa-calendar-alt"></i> Deadline: {new Date(app.deadline).toLocaleDateString()}</span>
                    )}
                    {app.amount && (
                      <span><i className="fas fa-dollar-sign"></i> {app.amount}</span>
                    )}
                    <span><i className="fas fa-clock"></i> Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>

                  {app.notes && (
                    <p className="app-notes"><i className="fas fa-sticky-note"></i> {app.notes}</p>
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
          margin-bottom: .25rem;
          display: flex; align-items: center; gap: .6rem;
        }
        .apps-header h1 i { color: #06b6d4; }
        .apps-header p { color: var(--color-text-muted); }

        .add-app-btn {
          display: flex; align-items: center; gap: .5rem;
          padding: .75rem 1.5rem;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          color: white; border: none; border-radius: .875rem;
          font-size: .95rem; font-weight: 700;
          cursor: pointer; transition: opacity .2s; white-space: nowrap;
        }
        .add-app-btn:hover { opacity: .9; }

        /* ── Stats row ───────────────────────────────────────────────────── */
        .apps-stats-row {
          display: flex; flex-wrap: wrap; gap: .75rem;
          margin-bottom: 1.5rem;
        }
        .apps-stat-chip {
          display: flex; align-items: center; gap: .5rem;
          padding: .45rem 1rem; border-radius: 1rem;
          font-size: .82rem; font-weight: 700;
        }
        .apps-stat-count { font-size: 1.1rem; font-weight: 800; }
        .apps-stat-label { font-weight: 600; }

        /* ── Tabs ────────────────────────────────────────────────────────── */
        .apps-tabs {
          display: flex; gap: .5rem; flex-wrap: wrap;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid var(--color-border);
          padding-bottom: .25rem;
        }
        .apps-tab {
          display: flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem;
          border: none; background: none;
          color: var(--color-text-muted); font-size: .875rem; font-weight: 500;
          cursor: pointer; border-bottom: 2.5px solid transparent;
          margin-bottom: -2px; transition: all .2s;
          border-radius: .4rem .4rem 0 0;
        }
        .apps-tab:hover { color: var(--color-text); }
        .apps-tab.active { color: #06b6d4; border-bottom-color: #06b6d4; font-weight: 700; }
        .tab-pill {
          background: var(--color-border); color: var(--color-text-muted);
          border-radius: 1rem; font-size: .7rem; font-weight: 700;
          padding: .1rem .45rem; min-width: 20px; text-align: center;
        }
        .apps-tab.active .tab-pill { background: #e0f9ff; color: #0891b2; }

        /* ── Cards ───────────────────────────────────────────────────────── */
        .apps-list { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 2rem; }
        .app-card {
          display: flex; align-items: flex-start; gap: 1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: .875rem;
          padding: 1.1rem 1.25rem;
          transition: all .2s;
        }
        .app-card:hover {
          border-color: #06b6d4;
          box-shadow: 0 4px 16px rgba(6,182,212,.08);
          transform: translateY(-1px);
        }
        .app-card-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          border-radius: .75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }
        .app-card-body { flex: 1; min-width: 0; }
        .app-card-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: .75rem; margin-bottom: .5rem;
          flex-wrap: wrap;
        }
        .app-title { font-size: .95rem; font-weight: 700; color: var(--color-text); margin-bottom: .15rem; }
        .app-title a { color: inherit; text-decoration: none; }
        .app-title a:hover { color: #06b6d4; }
        .app-company { font-size: .82rem; color: var(--color-text-muted); }
        .app-type-badge {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .2rem .6rem; border-radius: 1rem;
          font-size: .72rem; font-weight: 700; flex-shrink: 0;
        }
        .app-meta {
          display: flex; flex-wrap: wrap; gap: .5rem;
          font-size: .78rem; color: var(--color-text-muted);
          margin-bottom: .35rem;
        }
        .app-meta i { color: #06b6d4; margin-right: .2rem; }
        .app-notes {
          font-size: .8rem; color: var(--color-text-muted);
          font-style: italic; margin: 0;
        }
        .app-notes i { margin-right: .3rem; color: #f59e0b; }
        .app-card-right { flex-shrink: 0; }

        /* ── Status dropdown ─────────────────────────────────────────────── */
        .status-badge-btn {
          display: inline-flex; align-items: center;
          padding: .35rem .85rem;
          border-radius: 1rem; border: none;
          font-size: .8rem; font-weight: 700;
          cursor: pointer; transition: opacity .2s;
          white-space: nowrap;
        }
        .status-badge-btn:hover:not(:disabled) { opacity: .8; }
        .status-badge-btn:disabled { opacity: .6; cursor: not-allowed; }

        .status-dropdown-menu {
          position: absolute; top: calc(100% + .4rem); right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: .75rem;
          box-shadow: 0 8px 24px rgba(0,0,0,.14);
          z-index: 100; min-width: 150px;
          overflow: hidden;
        }
        .status-option {
          display: flex; align-items: center; gap: .6rem;
          width: 100%; padding: .65rem 1rem;
          background: none; border: none;
          color: var(--color-text); font-size: .85rem;
          cursor: pointer; text-align: left;
          transition: background .15s;
        }
        .status-option:hover { background: var(--color-bg); }
        .status-option.active { background: var(--bg, #f3f4f6); color: var(--tc, #374151); font-weight: 700; }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── Add manual modal ────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
        }
        .modal-card {
          background: var(--color-surface);
          border-radius: 1.25rem;
          width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
        }
        .modal-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 1.5rem 0;
          margin-bottom: .5rem;
        }
        .modal-head h2 { font-size: 1.15rem; color: var(--color-text); display: flex; align-items: center; gap: .5rem; }
        .modal-close-btn {
          background: none; border: none; color: var(--color-text-muted);
          cursor: pointer; font-size: 1.1rem; padding: .3rem .5rem;
          border-radius: .4rem; transition: all .2s;
        }
        .modal-close-btn:hover { background: #fee2e2; color: #ef4444; }
        .modal-desc {
          font-size: .875rem; color: var(--color-text-muted);
          padding: 0 1.5rem; margin-bottom: 1.25rem; line-height: 1.5;
        }
        .modal-form-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: .875rem; padding: 0 1.5rem;
        }
        .mfg-field { display: flex; flex-direction: column; gap: .35rem; }
        .mfg-field.full { grid-column: 1 / -1; }
        .mfg-field label { font-size: .82rem; font-weight: 600; color: var(--color-text-muted); }
        .mfg-field input,
        .mfg-field select,
        .mfg-field textarea {
          padding: .65rem .9rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          border-radius: .6rem; color: var(--color-text);
          font-size: .9rem; font-family: inherit;
          transition: border-color .2s; outline: none;
        }
        .mfg-field input:focus,
        .mfg-field select:focus,
        .mfg-field textarea:focus { border-color: #06b6d4; }
        .mfg-field textarea { resize: vertical; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: .75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border);
          margin-top: 1.25rem;
        }
        .modal-cancel {
          padding: .65rem 1.25rem;
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: .6rem; color: var(--color-text);
          cursor: pointer; font-size: .9rem;
        }
        .modal-submit {
          display: flex; align-items: center; gap: .5rem;
          padding: .65rem 1.5rem;
          background: linear-gradient(135deg,#06b6d4,#1e3a8a);
          color: white; border: none; border-radius: .6rem;
          cursor: pointer; font-size: .9rem; font-weight: 700;
        }
        .modal-submit:disabled { opacity: .6; cursor: not-allowed; }

        @media(max-width:640px) {
          .modal-form-grid { grid-template-columns: 1fr; }
          .apps-header { flex-direction: column; }
          .app-card { flex-wrap: wrap; }
          .app-card-right { width: 100%; }
        }
      `}</style>
    </div>
  );
}