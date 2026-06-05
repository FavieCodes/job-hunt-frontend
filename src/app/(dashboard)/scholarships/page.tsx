'use client';
import { useEffect, useState } from 'react';
import { scholarshipsAPI, adminScholarshipsAPI, userAPI, applicationsAPI, Scholarship, AddScholarshipForm } from '@/lib';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

const SCHOLARSHIPS_PER_PAGE = 10;

const emptyForm: AddScholarshipForm = {
  title: '', provider: '', description: '', country: '',
  field: '', deadline: '', amount: '', apply_url: '',
};

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
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to   = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-wrapper">
      <p className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{totalItems}</strong> scholarships
      </p>
      <div className="pagination">
        <button
          className="page-btn page-btn-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
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
          aria-label="Next page"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

function ConfirmApplyModal({
  scholarship,
  onConfirm,
  onCancel,
}: {
  scholarship: Scholarship;
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
          <h3><i className="fas fa-graduation-cap" style={{ color: '#06b6d4' }}></i> Confirm Application</h3>
          <button onClick={onCancel} className="modal-close"><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">
          <div className="confirm-job-info">
            <div className="confirm-logo">{scholarship.provider?.[0]?.toUpperCase() || 'S'}</div>
            <div>
              <p className="confirm-job-title">{scholarship.title}</p>
              <p className="confirm-company">{scholarship.provider || 'Scholarship Provider'}</p>
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

export default function ScholarshipsPage() {
  const [scholarships, setScholarships]     = useState<Scholarship[]>([]);
  const [loading, setLoading]               = useState(true);
  const [filters, setFilters]               = useState({ country: '', field: '', page: 1 });
  const [totalPages, setTotalPages]         = useState(1);
  const [totalScholarships, setTotalScholarships] = useState(0);
  const [user, setUser]                     = useState<any>(null);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [addForm, setAddForm]               = useState<AddScholarshipForm>(emptyForm);
  const [submitting, setSubmitting]         = useState(false);
  const [savedScholarships, setSavedScholarships] = useState<Set<string>>(new Set());
  const [savingId, setSavingId]                   = useState<string | null>(null);
  const [appliedScholarships, setAppliedScholarships] = useState<Set<string>>(new Set());
  const [pendingApply, setPendingApply] = useState<Scholarship | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  useEffect(() => {
    fetchScholarships();
    if (user && user.role !== 'admin') {
      fetchSavedScholarships();
      fetchAppliedScholarships();
    }
  }, [filters, user]);

  const fetchSavedScholarships = async () => {
    try {
      const saved = await userAPI.getSavedScholarships();
      setSavedScholarships(new Set(saved.map((s: any) => s.id)));
    } catch {}
  };

  const fetchAppliedScholarships = async () => {
    try {
      const apps = await applicationsAPI.getApplications();
      setAppliedScholarships(new Set(apps.filter((a: any) => a.scholarship_id).map((a: any) => a.scholarship_id)));
    } catch {}
  };

  const handleApplyClick = (scholarship: Scholarship) => {
    if (scholarship.apply_url) window.open(scholarship.apply_url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setPendingApply(scholarship), 400);
  };

  const handleConfirmApplied = async () => {
    if (!pendingApply) return;
    try {
      await applicationsAPI.applyForScholarship(pendingApply.id);
      setAppliedScholarships((prev) => new Set([...prev, pendingApply.id]));
      toast.success('Application recorded! Good luck 🎉');
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        setAppliedScholarships((prev) => new Set([...prev, pendingApply.id]));
        toast.success('Already recorded!');
      } else {
        toast.error(msg || 'Failed to record application');
      }
    } finally {
      setPendingApply(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await adminScholarshipsAPI.getAllScholarships({
          page: filters.page,
          limit: SCHOLARSHIPS_PER_PAGE,
          search: filters.field || undefined,
        });
        setScholarships(data.scholarships || []);
        setTotalPages(data.pages || 1);
        setTotalScholarships(data.total || 0);
      } else {
        const data = await scholarshipsAPI.searchScholarships({
          ...filters,
          limit: SCHOLARSHIPS_PER_PAGE,
        });
        setScholarships(data.scholarships || []);
        setTotalPages(data.pages || 1);
        setTotalScholarships(data.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScholarship = async () => {
    if (!addForm.title.trim()) { toast.error('Scholarship title is required'); return; }
    setSubmitting(true);
    try {
      await adminScholarshipsAPI.createScholarship(addForm);
      toast.success('Scholarship added successfully!');
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchScholarships();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add scholarship');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (scholarshipId: string) => {
    if (savingId === scholarshipId) return;
    setSavingId(scholarshipId);
    try {
      if (savedScholarships.has(scholarshipId)) {
        await userAPI.removeSavedScholarship(scholarshipId);
        setSavedScholarships((prev) => { const s = new Set(prev); s.delete(scholarshipId); return s; });
        toast.success('Removed from saved');
      } else {
        await userAPI.saveScholarship(scholarshipId);
        setSavedScholarships((prev) => new Set([...prev, scholarshipId]));
        toast.success('Scholarship saved!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setSavingId(null);
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return { text: 'Rolling deadline', color: '#10b981' };
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)  return { text: 'Closed', color: '#ef4444' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: '#f59e0b' };
    return { text: `${daysLeft} days left`, color: '#06b6d4' };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {pendingApply && (
        <ConfirmApplyModal
          scholarship={pendingApply}
          onConfirm={handleConfirmApplied}
          onCancel={() => setPendingApply(null)}
        />
      )}

      <div className="page-header">
        <div className="header-row">
          <div>
            <h1>
              <i className="fas fa-graduation-cap"></i>{' '}
              {isAdmin ? 'Manage Scholarships' : 'Scholarships & Grants'}
            </h1>
            <p>
              {isAdmin
                ? `${totalScholarships} total scholarships on the platform`
                : 'Discover funding opportunities worldwide'}
            </p>
          </div>
          {isAdmin && (
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus"></i> Add Scholarship
            </button>
          )}
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          {!isAdmin && (
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
          )}
          <input
            type="text"
            placeholder={isAdmin ? 'Search scholarships...' : 'Search by field of study...'}
            value={filters.field}
            onChange={(e) => setFilters({ ...filters, field: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {loading ? (
        <div className="scholarships-grid">
          {Array.from({ length: SCHOLARSHIPS_PER_PAGE }).map((_, i) => (
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
                  {isAdmin ? (
                    <div className="engagement-stats">
                      <span className="engagement-badge applied-badge">
                        <i className="fas fa-paper-plane"></i> {scholarship.applicant_count ?? 0} applied
                      </span>
                      <span className="engagement-badge saved-badge">
                        <i className="fas fa-bookmark"></i> {scholarship.saved_count ?? 0} saved
                      </span>
                    </div>
                  ) : (
                    <>
                      {appliedScholarships.has(scholarship.id) ? (
                        <span className="applied-badge">
                          <i className="fas fa-check-circle"></i> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(scholarship)}
                          className="apply-btn"
                        >
                          <i className="fas fa-external-link-alt"></i> Apply Now
                        </button>
                      )}
                      <button
                        className={`save-btn ${savedScholarships.has(scholarship.id) ? 'saved' : ''}`}
                        onClick={() => handleSave(scholarship.id)}
                        disabled={savingId === scholarship.id}
                        title={savedScholarships.has(scholarship.id) ? 'Remove from saved' : 'Save scholarship'}
                      >
                        <i className={savedScholarships.has(scholarship.id) ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                      </button>
                    </>
                  )}
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

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        totalItems={totalScholarships}
        itemsPerPage={SCHOLARSHIPS_PER_PAGE}
        onPageChange={handlePageChange}
      />

      {showAddModal && (
        <div className="fixed-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fixed-modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add New Scholarship</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title <span className="required">*</span></label>
                  <input type="text" placeholder="e.g. Chevening Scholarship" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Provider</label>
                  <input type="text" placeholder="e.g. UK Government" value={addForm.provider} onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" placeholder="e.g. United Kingdom" value={addForm.country} onChange={(e) => setAddForm({ ...addForm, country: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Field of Study</label>
                  <input type="text" placeholder="e.g. Engineering, Arts" value={addForm.field} onChange={(e) => setAddForm({ ...addForm, field: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Amount / Award</label>
                  <input type="text" placeholder="e.g. Full tuition + stipend" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="date" value={addForm.deadline} onChange={(e) => setAddForm({ ...addForm, deadline: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Apply URL</label>
                  <input type="url" placeholder="https://scholarship.org/apply" value={addForm.apply_url} onChange={(e) => setAddForm({ ...addForm, apply_url: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea placeholder="Scholarship description..." value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} rows={4} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddScholarship} disabled={submitting} className="submit-btn">
                {submitting
                  ? <><i className="fas fa-spinner fa-spin"></i> Adding...</>
                  : <><i className="fas fa-plus"></i> Add Scholarship</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-row { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
        .add-btn {
          display:flex; align-items:center; gap:.5rem;
          padding:.75rem 1.5rem;
          background:var(--color-primary,#06b6d4); color:white;
          border:none; border-radius:.75rem; font-size:.95rem; font-weight:600;
          cursor:pointer; transition:all .2s; white-space:nowrap;
        }
        .add-btn:hover { opacity:.9; transform:translateY(-1px); }
        .page-header { margin-bottom:2rem; }
        .page-header h1 { font-size:2rem; color:var(--color-text); margin-bottom:.5rem; }
        .page-header p  { color:var(--color-text-muted); }
        .filters-container { background:var(--color-surface); border:1px solid var(--color-border); border-radius:1rem; padding:1.5rem; margin-bottom:1.5rem; }
        .filter-group { display:flex; gap:1rem; }
        .filter-group select, .filter-group input { flex:1; padding:.75rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.75rem; color:var(--color-text); }
        .scholarships-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:1.5rem; margin-bottom:2rem; }
        .scholarship-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.25rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .scholarship-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .scholarship-card-header { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .scholarship-icon {
          width: 50px; height: 50px;
          background: linear-gradient(135deg,#10b981,#047857);
          border-radius: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: white;
        }
        .scholarship-info { flex: 1; }
        .scholarship-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
        .scholarship-title a { color: var(--color-text); text-decoration: none; }
        .scholarship-title a:hover { color: var(--color-primary); }
        .provider-name { color: var(--color-text-muted); font-size: 0.875rem; }
        .scholarship-details {
          display: flex; flex-wrap: wrap; gap: 1rem;
          margin-bottom: 1rem; padding: 0.75rem 0;
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }
        .detail-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted); }
        .detail-item i { width: 16px; }
        .scholarship-description { color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem; }
        .scholarship-card-footer { display: flex; gap: 0.75rem; }
        .apply-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.625rem; background: linear-gradient(135deg,#10b981,#047857);
          color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500;
          text-decoration: none; transition: background 0.2s;
        }
        .apply-btn:hover { opacity: .9; }
        .save-btn {
          width: 40px; background: var(--color-surface-2); border: 1px solid var(--color-border);
          border-radius: 0.5rem; cursor: pointer; color: var(--color-text-muted);
          transition: all 0.2s;
        }
        .save-btn:hover { color: var(--color-primary); border-color: var(--color-primary); }
        .save-btn.saved i { color: #10b981; }
        .applied-badge {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .4rem .85rem; border-radius: 2rem;
          font-size: .8rem; font-weight: 700;
          background: #d1fae5; color: #065f46;
          border: 1.5px solid #6ee7b7;
        }
        .engagement-stats { display: flex; gap: .75rem; align-items: center; flex: 1; }
        .engagement-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .85rem; border-radius: 2rem; font-size: .8rem; font-weight: 600; }
        .applied-badge-stats { background: #dbeafe; color: #1e40af; }
        .saved-badge { background: #ede9fe; color: #6d28d9; }

        .pagination-wrapper {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          margin-top: 2rem; padding-bottom: 2rem;
        }
        .pagination-info { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
        .pagination { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; justify-content: center; }
        .page-btn {
          min-width: 38px; height: 38px; padding: 0 0.6rem;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 0.5rem; cursor: pointer; color: var(--color-text);
          font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); font-weight: 700; }
        .page-btn-arrow { font-size: 0.75rem; }
        .page-ellipsis { min-width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 1rem; }

        .fixed-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
        }
        .fixed-modal-content { background: var(--color-surface); border-radius: 1rem; width: 90%; max-width: 420px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
        .fixed-modal-content.large { max-width: 680px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
        .modal-header h3 { font-size: 1.1rem; color: var(--color-text); display: flex; align-items: center; gap: .5rem; }
        .modal-close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 1.1rem; }
        .modal-body { padding: 1.5rem; }
        .confirm-job-info {
          display: flex; align-items: center; gap: 1rem; padding: 1rem;
          background: var(--color-bg); border-radius: 0.75rem; margin-bottom: 1rem;
          border: 1px solid var(--color-border);
        }
        .confirm-logo {
          width: 44px; height: 44px; flex-shrink: 0;
          background: linear-gradient(135deg, #10b981, #047857);
          border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; font-weight: 700; color: white;
        }
        .confirm-job-title { font-weight: 700; color: var(--color-text); font-size: .95rem; margin-bottom: .15rem; }
        .confirm-company { color: var(--color-text-muted); font-size: .82rem; }
        .confirm-desc { color: var(--color-text-muted); font-size: .875rem; margin-bottom: .75rem; }
        .confirm-question { font-weight: 600; color: var(--color-text); font-size: .95rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: .4rem; }
        .confirm-actions { display: flex; gap: .75rem; }
        .btn-not-yet {
          flex: 1; padding: .7rem; border: 1.5px solid var(--color-border);
          background: var(--color-bg); color: var(--color-text);
          border-radius: .6rem; cursor: pointer; font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: .4rem;
          transition: border-color .2s;
        }
        .btn-not-yet:hover { border-color: #ef4444; color: #ef4444; }
        .btn-yes-applied {
          flex: 1; padding: .7rem; background: #10b981; color: white;
          border: none; border-radius: .6rem; cursor: pointer; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: .4rem;
          transition: background .2s;
        }
        .btn-yes-applied:hover { background: #059669; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: .4rem; }
        .form-group.full-width { grid-column: 1/-1; }
        .form-group label { font-size: .85rem; font-weight: 600; color: var(--color-text-muted); }
        .required { color: #ef4444; }
        .form-group input, .form-group select, .form-group textarea {
          padding: .65rem .9rem; background: var(--color-bg);
          border: 1px solid var(--color-border); border-radius: .6rem;
          color: var(--color-text); font-size: .95rem; outline: none;
        }
        .cancel-btn { padding: .65rem 1.25rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: .6rem; color: var(--color-text); cursor: pointer; font-size: .95rem; }
        .submit-btn { display: flex; align-items: center; gap: .5rem; padding: .65rem 1.5rem; background: var(--color-primary,#06b6d4); color: white; border: none; border-radius: .6rem; cursor: pointer; font-size: .95rem; font-weight: 600; }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; }

        @media(max-width:768px) {
          .scholarships-grid { grid-template-columns: 1fr; }
          .filter-group { flex-direction: column; }
          .form-grid { grid-template-columns: 1fr; }
          .header-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}