'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ResumeForm {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string;
  languages: string;
}

const EMPTY_EXP = (): ExperienceEntry => ({
  id: Math.random().toString(36).slice(2),
  title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: '',
});
const EMPTY_EDU = (): EducationEntry => ({
  id: Math.random().toString(36).slice(2),
  degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '',
});

const STEPS = ['Personal Info', 'Summary & Skills', 'Experience', 'Education', 'Extras', 'Generate'];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="step-indicator">
      {STEPS.map((label, i) => (
        <div key={i} className={`step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}>
          <div className="dot">{i < current ? <i className="fas fa-check"></i> : i + 1}</div>
          <span className="step-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field-block">
      <label className="field-label">
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResumeBuilderPage() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const user = getUser();

  const [form, setForm] = useState<ResumeForm>({
    title: 'My Resume',
    fullName: user?.username || '',
    email: user?.email || '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
    skills: '',
    experience: [EMPTY_EXP()],
    education: [EMPTY_EDU()],
    certifications: '',
    languages: '',
  });

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/resume/history');
      setSavedResumes(Array.isArray(data) ? data : []);
    } catch {}
  };

  const set = (key: keyof ResumeForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateExp = (id: string, key: keyof ExperienceEntry, value: any) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => e.id === id ? { ...e, [key]: value } : e),
    }));

  const updateEdu = (id: string, key: keyof EducationEntry, value: any) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((e) => e.id === id ? { ...e, [key]: value } : e),
    }));

  const handleGenerate = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Full name and email are required');
      return;
    }
    setGenerating(true);
    setGeneratedHtml('');
    try {
      const { data } = await api.post('/resume/generate', form);
      setGeneratedHtml(data.generated_html || '');
      toast.success('Resume generated! 🎉');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate resume');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html><html><head>
        <title>${form.fullName} — Resume</title>
        <style>
          body { margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; font-size:11pt; color:#1a1a1a; }
          @media print { body { margin: 0; } }
        </style>
      </head><body>${generatedHtml}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const canNext = () => {
    if (step === 0) return form.fullName.trim() && form.email.trim();
    return true;
  };

  // ── Render step content ─────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0: // Personal Info
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-user"></i> Personal Information</h2>
            <div className="form-grid">
              <Field label="Resume Title">
                <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Backend Engineer Resume" />
              </Field>
              <Field label="Full Name" required>
                <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="John Adeyemi" />
              </Field>
              <Field label="Email" required>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@example.com" />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+234 800 000 0000" />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Lagos, Nigeria" />
              </Field>
              <Field label="LinkedIn URL">
                <input value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/yourname" />
              </Field>
              <Field label="Website / Portfolio">
                <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourportfolio.com" />
              </Field>
            </div>
          </div>
        );

      case 1: // Summary & Skills
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-align-left"></i> Summary & Skills</h2>
            <Field label="Professional Summary" hint="2–4 sentences about your experience, strengths, and career goal.">
              <textarea
                rows={5}
                value={form.summary}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications…"
              />
            </Field>
            <Field label="Skills" hint="Comma-separated: React, Node.js, PostgreSQL, Docker, AWS…">
              <textarea
                rows={3}
                value={form.skills}
                onChange={(e) => set('skills', e.target.value)}
                placeholder="JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, Docker"
              />
            </Field>
          </div>
        );

      case 2: // Experience
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-briefcase"></i> Work Experience</h2>
            {form.experience.map((exp, idx) => (
              <div key={exp.id} className="entry-block">
                <div className="entry-header">
                  <h4>Experience #{idx + 1}</h4>
                  {form.experience.length > 1 && (
                    <button className="remove-btn" onClick={() => set('experience', form.experience.filter((e) => e.id !== exp.id))}>
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <Field label="Job Title"><input value={exp.title} onChange={(e) => updateExp(exp.id, 'title', e.target.value)} placeholder="Software Engineer" /></Field>
                  <Field label="Company"><input value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme Corp" /></Field>
                  <Field label="Location"><input value={exp.location} onChange={(e) => updateExp(exp.id, 'location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
                  <Field label="Start Date"><input value={exp.startDate} onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></Field>
                  <Field label="End Date">
                    <input value={exp.current ? 'Present' : exp.endDate} onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)} placeholder="Dec 2024" disabled={exp.current} />
                  </Field>
                  <Field label="">
                    <label className="checkbox-row">
                      <input type="checkbox" checked={exp.current} onChange={(e) => updateExp(exp.id, 'current', e.target.checked)} />
                      <span>I currently work here</span>
                    </label>
                  </Field>
                </div>
                <Field label="Key Responsibilities & Achievements" hint="Each bullet on a new line. Start with action verbs: Built, Led, Optimised…">
                  <textarea rows={5} value={exp.bullets} onChange={(e) => updateExp(exp.id, 'bullets', e.target.value)} placeholder="Built a REST API serving 10k+ daily requests&#10;Reduced deployment time by 40% via CI/CD pipeline&#10;Mentored 3 junior developers" />
                </Field>
              </div>
            ))}
            <button className="add-entry-btn" onClick={() => set('experience', [...form.experience, EMPTY_EXP()])}>
              <i className="fas fa-plus"></i> Add Experience
            </button>
          </div>
        );

      case 3: // Education
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-graduation-cap"></i> Education</h2>
            {form.education.map((edu, idx) => (
              <div key={edu.id} className="entry-block">
                <div className="entry-header">
                  <h4>Education #{idx + 1}</h4>
                  {form.education.length > 1 && (
                    <button className="remove-btn" onClick={() => set('education', form.education.filter((e) => e.id !== edu.id))}>
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  )}
                </div>
                <div className="form-grid">
                  <Field label="Degree"><input value={edu.degree} onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)} placeholder="B.Sc. Computer Science" /></Field>
                  <Field label="Institution"><input value={edu.institution} onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)} placeholder="University of Lagos" /></Field>
                  <Field label="Location"><input value={edu.location} onChange={(e) => updateEdu(edu.id, 'location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
                  <Field label="Start Year"><input value={edu.startDate} onChange={(e) => updateEdu(edu.id, 'startDate', e.target.value)} placeholder="2018" /></Field>
                  <Field label="End Year"><input value={edu.endDate} onChange={(e) => updateEdu(edu.id, 'endDate', e.target.value)} placeholder="2022" /></Field>
                  <Field label="GPA / Grade (optional)"><input value={edu.gpa} onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)} placeholder="4.2 / 5.0" /></Field>
                </div>
              </div>
            ))}
            <button className="add-entry-btn" onClick={() => set('education', [...form.education, EMPTY_EDU()])}>
              <i className="fas fa-plus"></i> Add Education
            </button>
          </div>
        );

      case 4: // Extras
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-star"></i> Extras</h2>
            <Field label="Certifications" hint="One per line: AWS Certified Solutions Architect, Google Cloud Professional…">
              <textarea rows={4} value={form.certifications} onChange={(e) => set('certifications', e.target.value)} placeholder="AWS Certified Solutions Architect (2023)&#10;Google Cloud Professional Data Engineer (2022)" />
            </Field>
            <Field label="Languages" hint="Comma-separated with proficiency: English (Native), Yoruba (Fluent), French (Basic)">
              <input value={form.languages} onChange={(e) => set('languages', e.target.value)} placeholder="English (Native), Yoruba (Fluent)" />
            </Field>
          </div>
        );

      case 5: // Generate
        return (
          <div className="step-content">
            <h2 className="step-title"><i className="fas fa-magic"></i> Generate Your Resume</h2>
            <div className="generate-summary">
              <p>Your resume will be generated for:</p>
              <ul>
                <li><strong>{form.fullName}</strong> — {form.email}</li>
                {form.phone && <li><i className="fas fa-phone"></i> {form.phone}</li>}
                {form.location && <li><i className="fas fa-map-marker-alt"></i> {form.location}</li>}
                <li>{form.experience.filter((e) => e.title).length} work experience(s)</li>
                <li>{form.education.filter((e) => e.degree).length} education entry/entries</li>
                {form.skills && <li>Skills: {form.skills.slice(0, 60)}{form.skills.length > 60 ? '…' : ''}</li>}
              </ul>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="generate-btn">
              {generating
                ? <><i className="fas fa-spinner fa-spin"></i> Generating your resume…</>
                : <><i className="fas fa-magic"></i> Generate Resume</>}
            </button>

            {generatedHtml && (
              <div className="result-section">
                <div className="result-toolbar">
                  <span className="result-label"><i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Resume ready!</span>
                  <div className="result-actions">
                    <button onClick={handlePrint} className="print-btn">
                      <i className="fas fa-print"></i> Print / Save PDF
                    </button>
                    <button onClick={handleGenerate} disabled={generating} className="regen-btn">
                      <i className="fas fa-redo"></i> Regenerate
                    </button>
                  </div>
                </div>
                <div
                  ref={printRef}
                  className="resume-preview"
                  dangerouslySetInnerHTML={{ __html: generatedHtml }}
                />
              </div>
            )}

            {savedResumes.length > 0 && (
              <div className="history-panel">
                <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
                  <i className="fas fa-history"></i> Past resumes ({savedResumes.length})
                  <i className={`fas fa-chevron-${showHistory ? 'up' : 'down'}`}></i>
                </button>
                {showHistory && (
                  <div className="history-list">
                    {savedResumes.map((r) => (
                      <div key={r.id} className="history-item">
                        <div>
                          <strong>{r.title || 'Resume'}</strong>
                          <span style={{ fontSize: '.8rem', color: 'var(--color-text-muted)', marginLeft: '.5rem' }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setGeneratedHtml(r.generated_html || '')}
                          className="load-btn"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="page-header">
        <h1><i className="fas fa-file-alt"></i> Resume Builder</h1>
        <p>Fill in your details and let AI generate a polished, professional resume you can print or save as PDF</p>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      <div className="builder-card">
        {renderStep()}

        <div className="nav-buttons">
          {step > 0 && (
            <button className="nav-btn back" onClick={() => setStep((s) => s - 1)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button
              className="nav-btn next"
              onClick={() => { if (canNext()) setStep((s) => s + 1); else toast.error('Please fill required fields'); }}
            >
              Next <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-header { margin-bottom:2rem; }
        .page-header h1 { font-size:2rem; color:var(--color-text); margin-bottom:.5rem; }
        .page-header p  { color:var(--color-text-muted); }

        /* Step indicator */
        .step-indicator {
          display:flex; justify-content:space-between; align-items:flex-start;
          margin-bottom:1.75rem; gap:.25rem; overflow-x:auto;
          padding-bottom:.5rem;
        }
        .step-dot {
          display:flex; flex-direction:column; align-items:center; gap:.35rem;
          flex:1; min-width:60px;
        }
        .dot {
          width:32px; height:32px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:.82rem; font-weight:700;
          background:var(--color-bg); border:2px solid var(--color-border);
          color:var(--color-text-muted); transition:all .25s;
        }
        .step-dot.active .dot { background:#06b6d4; border-color:#06b6d4; color:white; }
        .step-dot.done  .dot { background:#10b981; border-color:#10b981; color:white; }
        .step-label { font-size:.7rem; color:var(--color-text-muted); text-align:center; white-space:nowrap; }
        .step-dot.active .step-label { color:#06b6d4; font-weight:600; }

        /* Builder card */
        .builder-card {
          background:var(--color-surface);
          border:1px solid var(--color-border);
          border-radius:1.25rem;
          padding:2rem;
          margin-bottom:2rem;
        }
        .step-title {
          font-size:1.3rem; font-weight:700; color:var(--color-text);
          display:flex; align-items:center; gap:.6rem;
          margin-bottom:1.75rem;
          padding-bottom:.75rem;
          border-bottom:2px solid var(--color-border);
        }
        .step-title i { color:#06b6d4; }

        /* Form */
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
        .field-block { display:flex; flex-direction:column; gap:.3rem; margin-bottom:.5rem; }
        .field-label { font-size:.82rem; font-weight:600; color:var(--color-text); }
        .field-hint  { font-size:.75rem; color:var(--color-text-muted); margin-top:.15rem; }
        .field-block input,
        .field-block textarea {
          padding:.6rem .9rem;
          background:var(--color-bg); border:1.5px solid var(--color-border);
          border-radius:.6rem; color:var(--color-text); font-size:.9rem; outline:none;
          transition:border-color .2s; font-family:inherit;
        }
        .field-block input:focus,.field-block textarea:focus { border-color:#06b6d4; }
        .field-block textarea { resize:vertical; }
        .checkbox-row { display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.9rem; color:var(--color-text); margin-top:.5rem; }
        .checkbox-row input { width:15px; height:15px; cursor:pointer; accent-color:#06b6d4; }

        /* Entry blocks */
        .entry-block {
          background:var(--color-bg);
          border:1px solid var(--color-border);
          border-radius:.875rem;
          padding:1.25rem;
          margin-bottom:1rem;
        }
        .entry-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
        .entry-header h4 { font-size:.95rem; font-weight:700; color:var(--color-text); }
        .remove-btn { display:flex; align-items:center; gap:.35rem; background:none; border:none; color:#ef4444; cursor:pointer; font-size:.82rem; padding:.3rem .6rem; border-radius:.4rem; transition:background .2s; }
        .remove-btn:hover { background:#fee2e2; }
        .add-entry-btn { display:flex; align-items:center; gap:.5rem; padding:.65rem 1.25rem; background:var(--color-bg); border:1.5px dashed var(--color-border); border-radius:.75rem; color:var(--color-primary); cursor:pointer; font-size:.9rem; font-weight:600; width:100%; justify-content:center; transition:all .2s; margin-top:.5rem; }
        .add-entry-btn:hover { border-color:#06b6d4; background:#f0f9ff; }

        /* Generate step */
        .generate-summary {
          background:var(--color-bg); border:1px solid var(--color-border);
          border-radius:.875rem; padding:1.25rem; margin-bottom:1.5rem;
        }
        .generate-summary p { font-weight:600; color:var(--color-text); margin-bottom:.75rem; }
        .generate-summary ul { list-style:none; padding:0; display:flex; flex-direction:column; gap:.4rem; }
        .generate-summary li { color:var(--color-text-muted); font-size:.9rem; }
        .generate-btn {
          display:flex; align-items:center; gap:.6rem;
          padding:.9rem 2rem;
          background:linear-gradient(135deg,#06b6d4,#1e3a8a);
          color:white; border:none; border-radius:.875rem;
          font-size:1rem; font-weight:700; cursor:pointer;
          margin-bottom:1.5rem; transition:opacity .2s;
        }
        .generate-btn:disabled { opacity:.65; cursor:not-allowed; }
        .result-section { margin-top:1.5rem; }
        .result-toolbar {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:1rem; flex-wrap:wrap; gap:.75rem;
        }
        .result-label { font-weight:700; color:var(--color-text); display:flex; align-items:center; gap:.5rem; }
        .result-actions { display:flex; gap:.75rem; }
        .print-btn {
          display:flex; align-items:center; gap:.4rem;
          padding:.6rem 1.25rem; background:#10b981; color:white;
          border:none; border-radius:.6rem; cursor:pointer; font-weight:600; font-size:.875rem;
        }
        .regen-btn {
          display:flex; align-items:center; gap:.4rem;
          padding:.6rem 1.1rem; background:var(--color-bg);
          border:1.5px solid var(--color-border);
          color:var(--color-text); border-radius:.6rem; cursor:pointer; font-size:.875rem;
        }
        .resume-preview {
          background:white; border:1px solid #d1d5db;
          border-radius:.875rem; padding:2rem;
          color:#1a1a1a; font-family:'Segoe UI',Arial,sans-serif; font-size:11pt;
          line-height:1.6; box-shadow:0 4px 20px rgba(0,0,0,.08);
        }
        /* History */
        .history-panel { margin-top:1.5rem; border-top:1px solid var(--color-border); padding-top:1rem; }
        .history-toggle { display:flex; align-items:center; gap:.5rem; background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:.875rem; width:100%; justify-content:space-between; padding:.5rem 0; }
        .history-list { margin-top:.75rem; display:flex; flex-direction:column; gap:.5rem; }
        .history-item { display:flex; justify-content:space-between; align-items:center; padding:.65rem .875rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.5rem; }
        .load-btn { padding:.3rem .75rem; background:#06b6d4; color:white; border:none; border-radius:.4rem; cursor:pointer; font-size:.8rem; font-weight:600; }

        /* Nav buttons */
        .nav-buttons { display:flex; justify-content:space-between; margin-top:1.75rem; padding-top:1.25rem; border-top:1px solid var(--color-border); }
        .nav-btn { display:flex; align-items:center; gap:.5rem; padding:.7rem 1.5rem; border-radius:.75rem; font-size:.95rem; font-weight:600; cursor:pointer; transition:all .2s; }
        .nav-btn.back { background:var(--color-bg); border:1.5px solid var(--color-border); color:var(--color-text); }
        .nav-btn.back:hover { border-color:#06b6d4; }
        .nav-btn.next { background:linear-gradient(135deg,#06b6d4,#1e3a8a); color:white; border:none; margin-left:auto; }
        .nav-btn.next:hover { opacity:.9; }
        .step-content { min-height:300px; }
        @media(max-width:640px) {
          .form-grid { grid-template-columns:1fr; }
          .step-label { display:none; }
          .result-toolbar { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}