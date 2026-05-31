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
    <div className="resume-step-indicator">
      {STEPS.map((label, i) => (
        <div key={i} className={`resume-step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}>
          <div className="resume-dot">{i < current ? <i className="fas fa-check"></i> : i + 1}</div>
          <span className="resume-step-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="resume-field-block">
      <label className="resume-field-label">
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {hint && <p className="resume-field-hint">{hint}</p>}
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
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-user"></i> Personal Information</h2>
            <div className="resume-form-grid">
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
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-align-left"></i> Summary & Skills</h2>
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
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-briefcase"></i> Work Experience</h2>
            {form.experience.map((exp, idx) => (
              <div key={exp.id} className="resume-entry-block">
                <div className="resume-entry-header">
                  <h4>Experience #{idx + 1}</h4>
                  {form.experience.length > 1 && (
                    <button className="resume-remove-btn" onClick={() => set('experience', form.experience.filter((e) => e.id !== exp.id))}>
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  )}
                </div>
                <div className="resume-form-grid">
                  <Field label="Job Title"><input value={exp.title} onChange={(e) => updateExp(exp.id, 'title', e.target.value)} placeholder="Software Engineer" /></Field>
                  <Field label="Company"><input value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme Corp" /></Field>
                  <Field label="Location"><input value={exp.location} onChange={(e) => updateExp(exp.id, 'location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
                  <Field label="Start Date"><input value={exp.startDate} onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></Field>
                  <Field label="End Date">
                    <input value={exp.current ? 'Present' : exp.endDate} onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)} placeholder="Dec 2024" disabled={exp.current} />
                  </Field>
                  <Field label="">
                    <label className="resume-checkbox-row">
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
            <button className="resume-add-entry-btn" onClick={() => set('experience', [...form.experience, EMPTY_EXP()])}>
              <i className="fas fa-plus"></i> Add Experience
            </button>
          </div>
        );

      case 3: // Education
        return (
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-graduation-cap"></i> Education</h2>
            {form.education.map((edu, idx) => (
              <div key={edu.id} className="resume-entry-block">
                <div className="resume-entry-header">
                  <h4>Education #{idx + 1}</h4>
                  {form.education.length > 1 && (
                    <button className="resume-remove-btn" onClick={() => set('education', form.education.filter((e) => e.id !== edu.id))}>
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  )}
                </div>
                <div className="resume-form-grid">
                  <Field label="Degree"><input value={edu.degree} onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)} placeholder="B.Sc. Computer Science" /></Field>
                  <Field label="Institution"><input value={edu.institution} onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)} placeholder="University of Lagos" /></Field>
                  <Field label="Location"><input value={edu.location} onChange={(e) => updateEdu(edu.id, 'location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
                  <Field label="Start Year"><input value={edu.startDate} onChange={(e) => updateEdu(edu.id, 'startDate', e.target.value)} placeholder="2018" /></Field>
                  <Field label="End Year"><input value={edu.endDate} onChange={(e) => updateEdu(edu.id, 'endDate', e.target.value)} placeholder="2022" /></Field>
                  <Field label="GPA / Grade (optional)"><input value={edu.gpa} onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)} placeholder="4.2 / 5.0" /></Field>
                </div>
              </div>
            ))}
            <button className="resume-add-entry-btn" onClick={() => set('education', [...form.education, EMPTY_EDU()])}>
              <i className="fas fa-plus"></i> Add Education
            </button>
          </div>
        );

      case 4: // Extras
        return (
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-star"></i> Extras</h2>
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
          <div className="resume-step-content">
            <h2 className="resume-step-title"><i className="fas fa-magic"></i> Generate Your Resume</h2>
            <div className="resume-generate-summary">
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
            <button onClick={handleGenerate} disabled={generating} className="resume-generate-btn">
              {generating
                ? <><i className="fas fa-spinner fa-spin"></i> Generating your resume…</>
                : <><i className="fas fa-magic"></i> Generate Resume</>}
            </button>

            {generatedHtml && (
              <div className="resume-result-section">
                <div className="resume-result-toolbar">
                  <span className="resume-result-label"><i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Resume ready!</span>
                  <div className="resume-result-actions">
                    <button onClick={handlePrint} className="resume-print-btn">
                      <i className="fas fa-print"></i> Print / Save PDF
                    </button>
                    <button onClick={handleGenerate} disabled={generating} className="resume-regen-btn">
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
              <div className="resume-history-panel">
                <button className="resume-history-toggle" onClick={() => setShowHistory(!showHistory)}>
                  <i className="fas fa-history"></i> Past resumes ({savedResumes.length})
                  <i className={`fas fa-chevron-${showHistory ? 'up' : 'down'}`}></i>
                </button>
                {showHistory && (
                  <div className="resume-history-list">
                    {savedResumes.map((r) => (
                      <div key={r.id} className="resume-history-item">
                        <div>
                          <strong>{r.title || 'Resume'}</strong>
                          <span className="resume-history-date">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setGeneratedHtml(r.generated_html || '')}
                          className="resume-load-btn"
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
    <div className="resume-builder-container">
      <div className="resume-page-header">
        <h1><i className="fas fa-file-alt"></i> Resume Builder</h1>
        <p>Fill in your details and let AI generate a polished, professional resume you can print or save as PDF</p>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      <div className="resume-builder-card">
        {renderStep()}

        <div className="resume-nav-buttons">
          {step > 0 && (
            <button className="resume-nav-btn back" onClick={() => setStep((s) => s - 1)}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button
              className="resume-nav-btn next"
              onClick={() => { if (canNext()) setStep((s) => s + 1); else toast.error('Please fill required fields'); }}
            >
              Next <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}