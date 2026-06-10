'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ── Types ─────────────────────────────────────────────────────────────────────

interface PortfolioInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string;
  experience: { company: string; role: string; period: string; description: string }[];
  projects: { name: string; description: string; technologies: string; url: string }[];
  education: { institution: string; degree: string; period: string }[];
  certifications: string;
}

interface PortfolioRecord {
  id: string;
  full_name: string;
  title: string;
  created_at: string;
  generated_html?: string;
}

const EMPTY_EXP  = () => ({ company: '', role: '', period: '', description: '' });
const EMPTY_PROJ = () => ({ name: '', description: '', technologies: '', url: '' });
const EMPTY_EDU  = () => ({ institution: '', degree: '', period: '' });

const STEPS = ['How to Start', 'Personal Info', 'Skills & Summary', 'Experience', 'Projects & Education', 'Generate'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tab, setTab]   = useState<'build' | 'history'>('build');
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [history, setHistory] = useState<PortfolioRecord[]>([]);
  const [viewHtml, setViewHtml] = useState<string | null>(null);
  const [cvParsing, setCvParsing] = useState(false);

  // Resume modal — show immediately, fetch details in background
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [latestResume, setLatestResume] = useState<any>(null);
  const [loadingFromResume, setLoadingFromResume] = useState(false);
  // Track whether we're enriching the resume record with form_data in background
  const [enrichedResume, setEnrichedResume] = useState<any>(null);

  const [info, setInfo] = useState<PortfolioInfo>({
    fullName: '', title: '', email: '', phone: '', location: '',
    linkedin: '', github: '', website: '', summary: '', skills: '',
    experience: [EMPTY_EXP()],
    projects: [EMPTY_PROJ()],
    education: [EMPTY_EDU()],
    certifications: '',
  });

  useEffect(() => {
    fetchHistory();
    checkExistingResume();
  }, []);

  const checkExistingResume = async () => {
    try {
      // Step 1: fetch history list — fast, show modal immediately if resume exists
      const { data } = await api.get('/resume/history');
      if (data && data.length > 0) {
        setLatestResume(data[0]);
        setShowResumeModal(true); // show modal right away with basic info

        // Step 2: enrich with full form_data in the background (non-blocking)
        api.get(`/resume/${data[0].id}`)
          .then(({ data: full }) => {
            if (full) setEnrichedResume(full);
          })
          .catch(() => {/* use base record if this fails */});
      }
    } catch { /* silent */ }
  };

  const buildFromResume = async () => {
    setLoadingFromResume(true);
    setShowResumeModal(false);

    // Use enriched record if available, fall back to basic history record
    const resumeRecord = enrichedResume || latestResume;

    try {
      // PRIMARY: use structured form_data saved when the resume was generated
      const fd = resumeRecord?.form_data
        ? (typeof resumeRecord.form_data === 'string'
            ? JSON.parse(resumeRecord.form_data)
            : resumeRecord.form_data)
        : null;

      if (fd) {
        const mapped: Partial<PortfolioInfo> = {
          fullName:       fd.fullName || fd.full_name || '',
          title:          fd.title || fd.targetRole || '',
          email:          fd.email || '',
          phone:          fd.phone || '',
          location:       fd.location || '',
          linkedin:       fd.linkedin || '',
          github:         fd.github || '',
          website:        fd.website || '',
          summary:        fd.summary || '',
          skills: Array.isArray(fd.skills)
            ? fd.skills.map((s: any) => (typeof s === 'string' ? s : s.name || s.skill || '')).join(', ')
            : (fd.skills || ''),
          experience: Array.isArray(fd.experience) && fd.experience.length > 0
            ? fd.experience.map((e: any) => ({
                company:     e.company || '',
                role:        e.title || e.role || '',
                period:      e.period || e.dates || '',
                description: Array.isArray(e.bullets) ? e.bullets.join(' ') : (e.description || ''),
              }))
            : [EMPTY_EXP()],
          projects: Array.isArray(fd.projects) && fd.projects.length > 0
            ? fd.projects.map((p: any) => ({
                name:         p.name || '',
                description:  p.description || '',
                technologies: p.technologies || p.tech || '',
                url:          p.url || '',
              }))
            : [EMPTY_PROJ()],
          education: Array.isArray(fd.education) && fd.education.length > 0
            ? fd.education.map((e: any) => ({
                institution: e.institution || e.school || '',
                degree:      e.degree || '',
                period:      e.period || e.dates || '',
              }))
            : [EMPTY_EDU()],
          certifications: Array.isArray(fd.certifications)
            ? fd.certifications.map((c: any) => (typeof c === 'string' ? c : c.name || '')).join(', ')
            : (fd.certifications || ''),
        };
        setInfo((prev) => ({ ...prev, ...mapped }));
        toast.success('Resume loaded! Ready to generate your portfolio.');
        setStep(5); // ← go straight to generate step
        return;
      }

      // FALLBACK: strip HTML tags from generated_html and send to parse-cv
      const rawHtml = resumeRecord?.generated_html || '';
      if (rawHtml.length > 100) {
        const text = rawHtml
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/  +/g, ' ')
          .trim();

        if (text.length > 50) {
          const { data } = await api.post('/portfolio/parse-cv', { cvText: text.slice(0, 6000) });
          if (data) {
            setInfo((prev) => ({ ...prev, ...data }));
            toast.success('Resume info loaded! Ready to generate your portfolio.');
            setStep(5); // ← go straight to generate step
            return;
          }
        }
      }

      // LAST RESORT: go to generate step with whatever we have (at minimum fullName from history)
      if (resumeRecord?.full_name) {
        setInfo((prev) => ({ ...prev, fullName: resumeRecord.full_name }));
      }
      toast('Pre-filled what we could. You can edit on the previous steps if needed.');
      setStep(5);
    } catch (err: any) {
      console.error('buildFromResume error:', err);
      toast.error('Something went wrong. Taking you to the generate step anyway.');
      setStep(5);
    } finally {
      setLoadingFromResume(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/portfolio/history');
      setHistory(data);
    } catch { /* silent */ }
  };

  const set = (field: keyof PortfolioInfo, value: any) =>
    setInfo((prev) => ({ ...prev, [field]: value }));

  const setArr = (field: 'experience' | 'projects' | 'education', idx: number, key: string, value: string) =>
    setInfo((prev) => {
      const arr = [...(prev[field] as any[])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, [field]: arr };
    });

  // ── CV upload & parse ─────────────────────────────────────────────────────

  const handleCvUpload = async (file: File) => {
    if (!file) return;
    setCvParsing(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }
      const { data } = await api.post('/portfolio/parse-cv', { cvText: text.slice(0, 6000) });
      if (data) {
        setInfo((prev) => ({ ...prev, ...data }));
        toast.success('CV parsed! Review and edit your info below.');
        setStep(1);
      }
    } catch {
      toast.error('Could not auto-parse CV. Please fill in your info manually.');
      setStep(1);
    } finally {
      setCvParsing(false);
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!info.fullName.trim()) {
      toast.error('Full name is required');
      setStep(1);
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post('/portfolio/generate', info);
      setPreviewHtml(data.generated_html);
      toast.success('Portfolio generated!');
      fetchHistory();
    } catch (err: any) {
      if (err?.response?.status === 429 || err?.response?.data?.error === 'daily_limit_reached') {
        router.push('/payment?feature=portfolio');
        return;
      }
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to generate portfolio');
    } finally {
      setGenerating(false);
    }
  };

  const downloadHtml = (html: string, name = 'portfolio.html') => {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const viewPortfolio = async (id: string) => {
    try {
      const { data } = await api.get(`/portfolio/${id}`);
      setViewHtml(data.generated_html);
    } catch {
      toast.error('Failed to load portfolio');
    }
  };

  const deletePortfolio = async (id: string) => {
    if (!confirm('Delete this portfolio?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      setHistory((h) => h.filter((p) => p.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Preview / view fullscreen ─────────────────────────────────────────────

  if (viewHtml) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 1.5rem', background: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setViewHtml(null)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', padding: '.5rem 1rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Portfolio Preview</span>
          <button onClick={() => downloadHtml(viewHtml)} style={{ marginLeft: 'auto', background: '#06b6d4', border: 'none', color: 'white', padding: '.5rem 1rem', borderRadius: '.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <i className="fas fa-download"></i> Download HTML
          </button>
        </div>
        <iframe srcDoc={viewHtml} style={{ flex: 1, border: 'none' }} title="Portfolio Preview" />
      </div>
    );
  }

  if (previewHtml) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            <i className="fas fa-check-circle" style={{ color: '#16a34a', marginRight: '.5rem' }}></i>Portfolio Ready!
          </h2>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button onClick={() => setViewHtml(previewHtml)} className="port-action-btn port-preview-btn">
              <i className="fas fa-eye"></i> Preview
            </button>
            <button onClick={() => downloadHtml(previewHtml)} className="port-action-btn port-download-btn">
              <i className="fas fa-download"></i> Download HTML
            </button>
            <button onClick={() => { setPreviewHtml(null); setStep(0); }} className="port-action-btn port-new-btn">
              <i className="fas fa-plus"></i> New Portfolio
            </button>
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden', height: '60vh' }}>
          <iframe srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: 'none' }} title="Portfolio Preview" />
        </div>
        <style>{`
          .port-action-btn { padding: .6rem 1.2rem; border: none; border-radius: .65rem; font-weight: 600; font-size: .85rem; cursor: pointer; display:flex; align-items:center; gap:.4rem; transition: opacity .2s; }
          .port-action-btn:hover { opacity:.85; }
          .port-preview-btn { background: #e0f9ff; color: #0e7490; }
          .port-download-btn { background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; }
          .port-new-btn { background: var(--color-border); color: var(--color-text); }
        `}</style>
      </div>
    );
  }

  // ── Main builder UI ───────────────────────────────────────────────────────

  return (
    <div className="port-page">
      {/* Resume Modal — renders as soon as latestResume is set */}
      {showResumeModal && latestResume && (
        <div className="port-resume-modal-overlay" onClick={() => setShowResumeModal(false)}>
          <div className="port-resume-modal" onClick={(e) => e.stopPropagation()}>
            <div className="port-modal-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h2>Use Your Existing Resume?</h2>
            <p>
              We found your resume <strong>&ldquo;{latestResume.title || 'My Resume'}&rdquo;</strong> on your account.
              Would you like us to build your portfolio from that information?
            </p>
            <div className="port-modal-actions">
              <button
                className="port-modal-yes"
                onClick={buildFromResume}
                disabled={loadingFromResume}
              >
                {loadingFromResume
                  ? <><i className="fas fa-spinner fa-spin"></i> Loading your resume…</>
                  : <><i className="fas fa-check"></i> Yes, use my resume</>}
              </button>
              <button
                className="port-modal-no"
                onClick={() => { setShowResumeModal(false); setStep(1); }}
              >
                <i className="fas fa-edit"></i> No, fill in manually
              </button>
            </div>
            <button className="port-modal-close" onClick={() => setShowResumeModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="port-tabs">
        <button className={`port-tab ${tab === 'build' ? 'active' : ''}`} onClick={() => setTab('build')}>
          <i className="fas fa-magic"></i> Build Portfolio
        </button>
        <button className={`port-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <i className="fas fa-history"></i> My Portfolios {history.length > 0 && <span className="port-badge">{history.length}</span>}
        </button>
      </div>

      {tab === 'history' ? (
        <div className="port-history">
          {history.length === 0 ? (
            <div className="port-empty">
              <i className="fas fa-folder-open"></i>
              <p>No portfolios yet. Build your first one!</p>
              <button onClick={() => setTab('build')} className="port-cta-btn">Build Portfolio</button>
            </div>
          ) : (
            <div className="port-history-grid">
              {history.map((p) => (
                <div key={p.id} className="port-history-card">
                  <div className="port-hist-icon"><i className="fas fa-globe"></i></div>
                  <div className="port-hist-info">
                    <h3>{p.full_name || 'Unnamed Portfolio'}</h3>
                    <p>{p.title || 'No title'}</p>
                    <span className="port-hist-date">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="port-hist-actions">
                    <button onClick={() => viewPortfolio(p.id)} title="Preview"><i className="fas fa-eye"></i></button>
                    <button onClick={() => deletePortfolio(p.id)} title="Delete" className="danger"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="port-builder">
          {/* Step indicator */}
          <div className="port-step-bar">
            {STEPS.map((s, i) => (
              <div key={i} className={`port-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="port-dot">{i < step ? <i className="fas fa-check"></i> : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="port-card">

            {/* Step 0: How to start */}
            {step === 0 && (
              <div className="port-start">
                <h2>Build Your Portfolio Website</h2>
                <p>We&apos;ll generate a fully responsive, professional portfolio site for you. Choose how to start:</p>
                <div className="port-start-options">
                  <label className="port-start-option" style={{ cursor: cvParsing ? 'wait' : 'pointer' }}>
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      style={{ display: 'none' }}
                      disabled={cvParsing}
                      onChange={(e) => e.target.files?.[0] && handleCvUpload(e.target.files[0])}
                    />
                    <div className="port-start-icon" style={{ background: 'linear-gradient(135deg,#06b6d4,#0e7490)' }}>
                      {cvParsing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                    </div>
                    <h3>{cvParsing ? 'Parsing your CV…' : 'Upload your CV'}</h3>
                    <p>We&apos;ll auto-fill your info from your existing CV (PDF or text).</p>
                  </label>
                  <button className="port-start-option" onClick={() => setStep(1)}>
                    <div className="port-start-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                      <i className="fas fa-edit"></i>
                    </div>
                    <h3>Fill in manually</h3>
                    <p>Enter your details step by step using our easy form.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div>
                <h2 className="port-step-title">Personal Information</h2>
                <div className="port-grid-2">
                  <div className="port-field">
                    <label>Full Name *</label>
                    <input value={info.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="port-field">
                    <label>Professional Title</label>
                    <input value={info.title} onChange={(e) => set('title', e.target.value)} placeholder="Full-Stack Developer" />
                  </div>
                  <div className="port-field">
                    <label>Email</label>
                    <input type="email" value={info.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" />
                  </div>
                  <div className="port-field">
                    <label>Phone</label>
                    <input value={info.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
                  </div>
                  <div className="port-field">
                    <label>Location</label>
                    <input value={info.location} onChange={(e) => set('location', e.target.value)} placeholder="Lagos, Nigeria" />
                  </div>
                  <div className="port-field">
                    <label>LinkedIn URL</label>
                    <input value={info.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/jane" />
                  </div>
                  <div className="port-field">
                    <label>GitHub URL</label>
                    <input value={info.github} onChange={(e) => set('github', e.target.value)} placeholder="https://github.com/jane" />
                  </div>
                  <div className="port-field">
                    <label>Personal Website</label>
                    <input value={info.website} onChange={(e) => set('website', e.target.value)} placeholder="https://jane.dev" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Skills & Summary */}
            {step === 2 && (
              <div>
                <h2 className="port-step-title">Skills & Summary</h2>
                <div className="port-field" style={{ marginBottom: '1.25rem' }}>
                  <label>Professional Summary</label>
                  <textarea rows={4} value={info.summary} onChange={(e) => set('summary', e.target.value)} placeholder="A brief description about yourself and your professional background…" />
                </div>
                <div className="port-field">
                  <label>Skills (comma-separated)</label>
                  <input value={info.skills} onChange={(e) => set('skills', e.target.value)} placeholder="React, Node.js, Python, PostgreSQL, Docker…" />
                </div>
                <div className="port-field" style={{ marginTop: '1.25rem' }}>
                  <label>Certifications (optional)</label>
                  <input value={info.certifications} onChange={(e) => set('certifications', e.target.value)} placeholder="AWS Certified Developer, Google Cloud Associate…" />
                </div>
              </div>
            )}

            {/* Step 3: Experience */}
            {step === 3 && (
              <div>
                <h2 className="port-step-title">Work Experience</h2>
                {info.experience.map((exp, i) => (
                  <div key={i} className="port-entry-block">
                    <div className="port-entry-header">
                      <span>Experience #{i + 1}</span>
                      {info.experience.length > 1 && (
                        <button onClick={() => setInfo((p) => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))} className="port-remove-btn">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <div className="port-grid-2">
                      <div className="port-field"><label>Company</label><input value={exp.company} onChange={(e) => setArr('experience', i, 'company', e.target.value)} placeholder="Acme Corp" /></div>
                      <div className="port-field"><label>Role / Title</label><input value={exp.role} onChange={(e) => setArr('experience', i, 'role', e.target.value)} placeholder="Senior Developer" /></div>
                      <div className="port-field"><label>Period</label><input value={exp.period} onChange={(e) => setArr('experience', i, 'period', e.target.value)} placeholder="Jan 2021 – Present" /></div>
                    </div>
                    <div className="port-field"><label>Description / Achievements</label><textarea rows={3} value={exp.description} onChange={(e) => setArr('experience', i, 'description', e.target.value)} placeholder="Key responsibilities and achievements…" /></div>
                  </div>
                ))}
                <button onClick={() => setInfo((p) => ({ ...p, experience: [...p.experience, EMPTY_EXP()] }))} className="port-add-btn">
                  <i className="fas fa-plus"></i> Add Experience
                </button>
              </div>
            )}

            {/* Step 4: Projects & Education */}
            {step === 4 && (
              <div>
                <h2 className="port-step-title">Projects</h2>
                {info.projects.map((proj, i) => (
                  <div key={i} className="port-entry-block">
                    <div className="port-entry-header">
                      <span>Project #{i + 1}</span>
                      {info.projects.length > 1 && (
                        <button onClick={() => setInfo((p) => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))} className="port-remove-btn">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <div className="port-grid-2">
                      <div className="port-field"><label>Project Name</label><input value={proj.name} onChange={(e) => setArr('projects', i, 'name', e.target.value)} placeholder="My Awesome App" /></div>
                      <div className="port-field"><label>Technologies</label><input value={proj.technologies} onChange={(e) => setArr('projects', i, 'technologies', e.target.value)} placeholder="React, Node, PostgreSQL" /></div>
                      <div className="port-field"><label>Live URL (optional)</label><input value={proj.url} onChange={(e) => setArr('projects', i, 'url', e.target.value)} placeholder="https://myapp.com" /></div>
                    </div>
                    <div className="port-field"><label>Description</label><textarea rows={2} value={proj.description} onChange={(e) => setArr('projects', i, 'description', e.target.value)} placeholder="What this project does and why it matters…" /></div>
                  </div>
                ))}
                <button onClick={() => setInfo((p) => ({ ...p, projects: [...p.projects, EMPTY_PROJ()] }))} className="port-add-btn">
                  <i className="fas fa-plus"></i> Add Project
                </button>

                <h2 className="port-step-title" style={{ marginTop: '2rem' }}>Education</h2>
                {info.education.map((edu, i) => (
                  <div key={i} className="port-entry-block">
                    <div className="port-grid-2">
                      <div className="port-field"><label>Institution</label><input value={edu.institution} onChange={(e) => setArr('education', i, 'institution', e.target.value)} placeholder="University of Lagos" /></div>
                      <div className="port-field"><label>Degree</label><input value={edu.degree} onChange={(e) => setArr('education', i, 'degree', e.target.value)} placeholder="B.Sc Computer Science" /></div>
                      <div className="port-field"><label>Period</label><input value={edu.period} onChange={(e) => setArr('education', i, 'period', e.target.value)} placeholder="2018 – 2022" /></div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setInfo((p) => ({ ...p, education: [...p.education, EMPTY_EDU()] }))} className="port-add-btn">
                  <i className="fas fa-plus"></i> Add Education
                </button>
              </div>
            )}

            {/* Step 5: Generate */}
            {step === 5 && (
              <div className="port-generate-step">
                <div className="port-gen-icon"><i className="fas fa-magic"></i></div>
                <h2>Ready to generate your portfolio?</h2>
                <p>We&apos;ll create a fully responsive portfolio website based on the information you provided. The process takes about 30–60 seconds.</p>
                <div className="port-gen-summary">
                  <div className="port-gen-item"><i className="fas fa-user"></i> {info.fullName || 'No name provided'}</div>
                  <div className="port-gen-item"><i className="fas fa-briefcase"></i> {info.title || 'No title provided'}</div>
                  <div className="port-gen-item"><i className="fas fa-code"></i> {info.experience.filter((e) => e.company).length} experience entries</div>
                  <div className="port-gen-item"><i className="fas fa-project-diagram"></i> {info.projects.filter((p) => p.name).length} projects</div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="port-generate-btn">
                  {generating
                    ? <><i className="fas fa-spinner fa-spin"></i> Generating your portfolio…</>
                    : <><i className="fas fa-magic"></i> Generate Portfolio</>}
                </button>
                <p className="port-limit-note">
                  <i className="fas fa-info-circle"></i> Free plan: 1 portfolio per day.{' '}
                  <button onClick={() => router.push('/payment?feature=portfolio')} style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Upgrade for unlimited
                  </button>
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="port-nav">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} className="port-nav-btn port-nav-back">
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => {
                    if (step === 1 && !info.fullName.trim()) { toast.error('Full name is required'); return; }
                    setStep((s) => s + 1);
                  }}
                  className="port-nav-btn port-nav-next"
                >
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .port-page { max-width: 860px; margin: 0 auto; padding: 0 0 4rem; }
        .port-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: .75rem; padding: .35rem; }
        .port-tab { flex: 1; padding: .6rem; border: none; background: none; border-radius: .5rem; font-size: .875rem; font-weight: 600; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: .5rem; transition: all .2s; }
        .port-tab.active { background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; }
        .port-badge { background: #ef4444; color: white; border-radius: 2rem; padding: .1rem .5rem; font-size: .7rem; }
        .port-step-bar { display: flex; align-items: center; gap: 0; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: .5rem; }
        .port-step-dot { display: flex; flex-direction: column; align-items: center; gap: .3rem; flex: 1; min-width: 60px; }
        .port-dot { width: 30px; height: 30px; border-radius: 50%; background: var(--color-border); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 700; transition: all .2s; }
        .port-step-dot.active .port-dot { background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; }
        .port-step-dot.done .port-dot { background: #16a34a; color: white; }
        .port-step-dot span { font-size: .65rem; color: var(--color-text-muted); text-align: center; white-space: nowrap; }
        .port-step-dot.active span { color: #06b6d4; font-weight: 600; }
        .port-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.75rem; }
        .port-step-title { font-size: 1.15rem; font-weight: 800; color: var(--color-text); margin-bottom: 1.25rem; padding-bottom: .75rem; border-bottom: 2px solid var(--color-border); }
        .port-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .port-field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: .25rem; }
        .port-field label { font-size: .8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .03em; }
        .port-field input, .port-field textarea { padding: .65rem .85rem; border: 1.5px solid var(--color-border); border-radius: .6rem; background: var(--color-bg); color: var(--color-text); font-size: .9rem; transition: border-color .2s; resize: vertical; font-family: inherit; }
        .port-field input:focus, .port-field textarea:focus { outline: none; border-color: #06b6d4; }
        .port-entry-block { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: .75rem; padding: 1.25rem; margin-bottom: 1rem; }
        .port-entry-header { display: flex; justify-content: space-between; align-items: center; font-size: .85rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: .75rem; }
        .port-remove-btn { background: none; border: none; color: #ef4444; cursor: pointer; font-size: .9rem; }
        .port-add-btn { display: flex; align-items: center; gap: .5rem; padding: .6rem 1.2rem; background: none; border: 1.5px dashed var(--color-border); border-radius: .65rem; color: var(--color-text-muted); font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .2s; margin-top: .5rem; }
        .port-add-btn:hover { border-color: #06b6d4; color: #06b6d4; }
        .port-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--color-border); }
        .port-nav-btn { padding: .7rem 1.5rem; border: none; border-radius: .65rem; font-weight: 700; font-size: .9rem; cursor: pointer; display: flex; align-items: center; gap: .5rem; transition: opacity .2s; }
        .port-nav-back { background: var(--color-border); color: var(--color-text); margin-right: auto; }
        .port-nav-next { background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; margin-left: auto; }
        .port-nav-btn:hover { opacity: .85; }
        .port-start { text-align: center; }
        .port-start h2 { font-size: 1.4rem; font-weight: 800; color: var(--color-text); margin-bottom: .5rem; }
        .port-start > p { color: var(--color-text-muted); margin-bottom: 2rem; font-size: .95rem; }
        .port-start-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .port-start-option { padding: 1.75rem 1.25rem; background: var(--color-bg); border: 2px solid var(--color-border); border-radius: 1rem; cursor: pointer; display: block; width: 100%; text-align: center; transition: all .2s; }
        .port-start-option:hover { border-color: #06b6d4; transform: translateY(-2px); }
        .port-start-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.4rem; margin: 0 auto 1rem; }
        .port-start-option h3 { font-size: 1rem; font-weight: 700; color: var(--color-text); margin-bottom: .35rem; }
        .port-start-option p { font-size: .8rem; color: var(--color-text-muted); line-height: 1.4; margin: 0; }
        .port-generate-step { text-align: center; padding: 1rem 0; }
        .port-gen-icon { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#06b6d4,#1e3a8a); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; margin: 0 auto 1.25rem; }
        .port-generate-step h2 { font-size: 1.3rem; font-weight: 800; color: var(--color-text); margin-bottom: .5rem; }
        .port-generate-step > p { color: var(--color-text-muted); font-size: .9rem; line-height: 1.6; max-width: 480px; margin: 0 auto 1.5rem; }
        .port-gen-summary { display: inline-flex; flex-direction: column; gap: .5rem; text-align: left; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: .75rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
        .port-gen-item { display: flex; align-items: center; gap: .6rem; font-size: .85rem; color: var(--color-text); }
        .port-gen-item i { color: #06b6d4; width: 16px; }
        .port-generate-btn { padding: .9rem 2.5rem; background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; border: none; border-radius: .75rem; font-size: 1rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: .6rem; transition: opacity .2s; }
        .port-generate-btn:disabled { opacity: .7; cursor: not-allowed; }
        .port-generate-btn:not(:disabled):hover { opacity: .9; }
        .port-limit-note { margin-top: 1rem; font-size: .8rem; color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: .4rem; }
        .port-limit-note i { color: #06b6d4; }
        .port-history { padding: .5rem 0; }
        .port-empty { text-align: center; padding: 4rem 1rem; color: var(--color-text-muted); }
        .port-empty i { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .port-empty p { font-size: 1rem; margin-bottom: 1.25rem; }
        .port-cta-btn { padding: .7rem 1.75rem; background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; border: none; border-radius: .65rem; font-weight: 700; cursor: pointer; }
        .port-history-grid { display: flex; flex-direction: column; gap: .75rem; }
        .port-history-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: .85rem; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; }
        .port-hist-icon { width: 44px; height: 44px; border-radius: .65rem; background: linear-gradient(135deg,#06b6d4,#1e3a8a); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; flex-shrink: 0; }
        .port-hist-info { flex: 1; }
        .port-hist-info h3 { font-size: .95rem; font-weight: 700; color: var(--color-text); margin-bottom: .15rem; }
        .port-hist-info p { font-size: .8rem; color: var(--color-text-muted); }
        .port-hist-date { font-size: .75rem; color: var(--color-text-muted); }
        .port-hist-actions { display: flex; gap: .5rem; }
        .port-hist-actions button { width: 34px; height: 34px; border-radius: .5rem; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
        .port-hist-actions button:hover { border-color: #06b6d4; color: #06b6d4; }
        .port-hist-actions button.danger:hover { border-color: #ef4444; color: #ef4444; }
        /* Resume modal */
        .port-resume-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(4px); animation: fadeIn .15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .port-resume-modal { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1.25rem; padding: 2rem; max-width: 480px; width: 100%; position: relative; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,.2); animation: slideUp .2s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .port-modal-icon { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,#06b6d4,#1e3a8a); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem; margin: 0 auto 1.25rem; }
        .port-resume-modal h2 { font-size: 1.25rem; font-weight: 800; color: var(--color-text); margin-bottom: .6rem; }
        .port-resume-modal > p { font-size: .9rem; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 1.5rem; }
        .port-resume-modal > p strong { color: var(--color-text); }
        .port-modal-actions { display: flex; flex-direction: column; gap: .75rem; }
        .port-modal-yes { padding: .85rem; background: linear-gradient(135deg,#06b6d4,#1e3a8a); color: white; border: none; border-radius: .75rem; font-size: .95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem; transition: opacity .2s; }
        .port-modal-yes:hover:not(:disabled) { opacity: .9; }
        .port-modal-yes:disabled { opacity: .6; cursor: not-allowed; }
        .port-modal-no { padding: .85rem; background: var(--color-bg); color: var(--color-text); border: 1.5px solid var(--color-border); border-radius: .75rem; font-size: .95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem; transition: all .2s; }
        .port-modal-no:hover { border-color: #06b6d4; color: #06b6d4; }
        .port-modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 1.1rem; padding: .25rem; transition: color .2s; }
        .port-modal-close:hover { color: var(--color-text); }
        @media (max-width: 640px) {
          .port-grid-2 { grid-template-columns: 1fr; }
          .port-start-options { grid-template-columns: 1fr; }
          .port-step-bar { gap: 0; }
          .port-step-dot span { display: none; }
          .port-resume-modal { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}