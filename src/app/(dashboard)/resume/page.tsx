'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

// Import pdf.js dynamically
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to use the local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceEntry {
  id: string; title: string; company: string; location: string;
  startDate: string; endDate: string; current: boolean; bullets: string;
}
interface EducationEntry {
  id: string; degree: string; institution: string; location: string;
  startDate: string; endDate: string; gpa: string;
}
interface ResumeForm {
  title: string; fullName: string; email: string; phone: string;
  location: string; linkedin: string; github: string; website: string; summary: string;
  skills: string; experience: ExperienceEntry[]; education: EducationEntry[];
  certifications: string; languages: string;
}
interface SavedResume {
  id: string; title: string; resume_type: 'generated' | 'tailored';
  created_at: string; generated_html: string;
}

const EMPTY_EXP = (): ExperienceEntry => ({
  id: Math.random().toString(36).slice(2),
  title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: '',
});
const EMPTY_EDU = (): EducationEntry => ({
  id: Math.random().toString(36).slice(2),
  degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '',
});

const BUILD_STEPS = ['Personal Info', 'Summary & Skills', 'Experience', 'Education', 'Extras', 'Generate'];

// ── Shared small components ───────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="resume-step-indicator">
      {BUILD_STEPS.map((label, i) => (
        <div key={i} className={`resume-step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}>
          <div className="resume-dot">{i < current ? <i className="fas fa-check"></i> : i + 1}</div>
          <span className="resume-step-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── File → readable text extractor ───────────────────────────────────────────

// Extract text using pdf.js for PDFs
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

async function extractTextFromFile(file: File): Promise<{ text: string; error?: string }> {
  const name = file.name.toLowerCase();

  // Plain text — read directly
  if (file.type === 'text/plain' || name.endsWith('.txt')) {
    const text = await file.text();
    return { text };
  }

  // DOCX — use mammoth
  if (name.endsWith('.docx') || name.endsWith('.doc') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword') {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 20) {
        return { text: result.value };
      }
      return { text: '', error: 'Could not extract text from this Word document. Please paste your resume text below.' };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return { text: '', error: 'Could not read the Word document. Please paste your resume text below.' };
    }
  }

  // PDF — use pdf.js for proper extraction
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const extractedText = await extractTextFromPDF(file);
    
    if (extractedText && extractedText.trim().length > 50) {
      return { text: extractedText };
    } else {
      return {
        text: '',
        error: 'Could not extract text from PDF. Please make sure the PDF contains selectable text, or copy and paste your resume text below.',
      };
    }
  }

  return { text: '', error: 'Unsupported file type. Please upload a .txt, .pdf, or .docx file, or paste your resume text below.' };
}

// ── PDF Download Function ─────────────────────────────────────────────────────
const downloadPDF = (html: string, fileName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Please allow popups to download PDF');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${fileName} - Resume</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a;
            background: white;
            padding: 40px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${html}
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ── Main page component ───────────────────────────────────────────────────────

type ActiveTab = 'build' | 'tailor' | 'history';

export default function ResumeBuilderPage() {
  const user = getUser();

  const [activeTab, setActiveTab] = useState<ActiveTab>('build');

  // Build state
  const [step, setStep]               = useState(0);
  const [generating, setGenerating]   = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');

  const [form, setForm] = useState<ResumeForm>({
    title: '', fullName: user?.username || '', email: user?.email || '',
    phone: '', location: '', linkedin: '', github: '', website: '',
    summary: '', skills: '',
    experience: [EMPTY_EXP()], education: [EMPTY_EDU()],
    certifications: '', languages: '',
  });

  // Tailor state
  const [tailorFile, setTailorFile]         = useState<File | null>(null);
  const [tailorText, setTailorText]         = useState('');
  const [extracting, setExtracting]         = useState(false);
  const [targetRole, setTargetRole]         = useState('');
  const [tailoring, setTailoring]           = useState(false);
  const [tailoredHtml, setTailoredHtml]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [savedResumes, setSavedResumes]     = useState<SavedResume[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingResume, setViewingResume]   = useState<SavedResume | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/resume/history');
      setSavedResumes(Array.isArray(data) ? data : []);
    } catch {}
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Form helpers
  const set = (key: keyof ResumeForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateExp = (id: string, key: keyof ExperienceEntry, value: any) =>
    setForm((prev) => ({ ...prev, experience: prev.experience.map((e) => e.id === id ? { ...e, [key]: value } : e) }));

  const updateEdu = (id: string, key: keyof EducationEntry, value: any) =>
    setForm((prev) => ({ ...prev, education: prev.education.map((e) => e.id === id ? { ...e, [key]: value } : e) }));

  // Generate resume
  const handleGenerate = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Full name and email are required'); return;
    }
    setGenerating(true); setGeneratedHtml('');
    try {
      const { data } = await api.post('/resume/generate', form);
      setGeneratedHtml(data.generated_html || '');
      toast.success('Resume generated and saved! 🎉');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate resume');
    } finally { setGenerating(false); }
  };

  // File upload for Tailor tab 
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTailorFile(file);
    setTailorText('');
    setExtracting(true);

    const { text, error } = await extractTextFromFile(file);

    setExtracting(false);

    if (error) {
      toast.error(error, { duration: 5000 });
    } else if (text.trim().length > 20) {
      setTailorText(text);
      toast.success(`Extracted ${text.split(/\s+/).length} words from ${file.name}`);
    } else {
      toast.error('No readable text found. Please paste your resume text in the box below.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Tailor resume
  const handleTailor = async () => {
    if (!tailorText.trim()) {
      toast.error('Please upload your resume file or paste your resume text first'); return;
    }
    if (!targetRole.trim()) {
      toast.error('Please enter the role you are applying for'); return;
    }
    setTailoring(true); setTailoredHtml('');
    try {
      const { data } = await api.post('/resume/tailor', {
        resumeText: tailorText,
        targetRole: targetRole.trim(),
      });
      setTailoredHtml(data.generated_html || '');
      toast.success('Resume tailored and saved! 🎯');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to tailor resume. Check your AI API keys.');
    } finally { setTailoring(false); }
  };

  // Delete saved resume
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/resume/${id}`);
      setSavedResumes((prev) => prev.filter((r) => r.id !== id));
      if (viewingResume?.id === id) setViewingResume(null);
      toast.success('Resume deleted');
    } catch { toast.error('Failed to delete resume'); }
    finally { setDeletingId(null); }
  };

  const canNext = () => {
    if (step === 0) return form.fullName.trim() && form.email.trim();
    return true;
  };

  // ── Build step renderer ───────────────────────────────────────────────────
  const renderBuildStep = () => {
    switch (step) {
      case 0: return (
        <div className="resume-step-content">
          <h2 className="resume-step-title"><i className="fas fa-user"></i> Personal Information</h2>
          <div className="resume-form-grid">
            <Field label="Full Name" required><input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="John Adeyemi" /></Field>
            <Field label="Email" required><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@example.com" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+234 800 000 0000" /></Field>
            <Field label="Location"><input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Lagos, Nigeria" /></Field>
            <Field label="LinkedIn URL"><input value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/yourname" /></Field>
            <Field label="GitHub URL"><input value={form.github} onChange={(e) => set('github', e.target.value)} placeholder="https://github.com/yourusername" /></Field>
            <Field label="Website / Portfolio"><input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourportfolio.com" /></Field>
          </div>
        </div>
      );

      case 1: return (
        <div className="resume-step-content">
          <h2 className="resume-step-title"><i className="fas fa-align-left"></i> Summary & Skills</h2>
          <div className="resume-ai-hint">
            <i className="fas fa-magic"></i>
            <span>Leave <strong>Summary</strong> blank and AI will generate a professional one based on your role and experience.</span>
          </div>
          <Field label="Professional Summary" hint="2–4 sentences. Leave blank for AI to write it.">
            <textarea rows={5} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Leave blank and AI will write a tailored professional summary for you…" />
          </Field>
          <Field label="Skills" hint="Comma-separated: React, Node.js, PostgreSQL, Docker, AWS…">
            <textarea rows={3} value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, Docker" />
          </Field>
        </div>
      );

      case 2: return (
        <div className="resume-step-content">
          <h2 className="resume-step-title"><i className="fas fa-briefcase"></i> Work Experience</h2>
          <div className="resume-ai-hint">
            <i className="fas fa-magic"></i>
            <span>Leave <strong>Key Responsibilities</strong> blank and AI will generate achievement-focused bullet points for each role.</span>
          </div>
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
              <Field label="Key Responsibilities & Achievements" hint="Each bullet on a new line. Leave blank for AI to generate.">
                <textarea rows={5} value={exp.bullets} onChange={(e) => updateExp(exp.id, 'bullets', e.target.value)}
                  placeholder={"Leave blank and AI will generate impactful bullet points…\nOr write your own:\nBuilt a REST API serving 10k+ daily requests\nReduced deployment time by 40% via CI/CD pipeline"} />
              </Field>
            </div>
          ))}
          <button className="resume-add-entry-btn" onClick={() => set('experience', [...form.experience, EMPTY_EXP()])}>
            <i className="fas fa-plus"></i> Add Experience
          </button>
        </div>
      );

      case 3: return (
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

      case 4: return (
        <div className="resume-step-content">
          <h2 className="resume-step-title"><i className="fas fa-star"></i> Extras</h2>
          <Field label="Certifications" hint="One per line: AWS Certified Solutions Architect, Google Cloud Professional…">
            <textarea rows={4} value={form.certifications} onChange={(e) => set('certifications', e.target.value)}
              placeholder={"AWS Certified Solutions Architect (2023)\nGoogle Cloud Professional Data Engineer (2022)"} />
          </Field>
          <Field label="Languages" hint="Comma-separated with proficiency: English (Native), Yoruba (Fluent), French (Basic)">
            <input value={form.languages} onChange={(e) => set('languages', e.target.value)} placeholder="English (Native), Yoruba (Fluent)" />
          </Field>
        </div>
      );

      case 5: return (
        <div className="resume-step-content">
          <h2 className="resume-step-title"><i className="fas fa-magic"></i> Generate Your Resume</h2>
          <div className="resume-generate-summary">
            <p>Your resume will be generated for:</p>
            <ul>
              <li><strong>{form.fullName}</strong> — {form.email}</li>
              {form.phone    && <li><i className="fas fa-phone"></i> {form.phone}</li>}
              {form.location && <li><i className="fas fa-map-marker-alt"></i> {form.location}</li>}
              {form.github   && <li><i className="fab fa-github"></i> {form.github}</li>}
              {form.linkedin && <li><i className="fab fa-linkedin"></i> {form.linkedin}</li>}
              <li>{form.experience.filter((e) => e.title).length} work experience(s)</li>
              <li>{form.education.filter((e) => e.degree).length} education entry/entries</li>
              {form.skills && <li>Skills: {form.skills.slice(0, 60)}{form.skills.length > 60 ? '…' : ''}</li>}
            </ul>
            {(!form.summary.trim() || form.experience.some((e) => !e.bullets.trim())) && (
              <div className="resume-ai-hint" style={{ marginTop: '1rem' }}>
                <i className="fas fa-magic"></i>
                <span>AI will automatically fill in your missing summary and/or experience bullets.</span>
              </div>
            )}
          </div>

          <button onClick={handleGenerate} disabled={generating} className="resume-generate-btn">
            {generating
              ? <><i className="fas fa-spinner fa-spin"></i> Generating your resume…</>
              : <><i className="fas fa-magic"></i> Generate &amp; Save Resume</>}
          </button>

          {generatedHtml && (
            <div className="resume-result-section">
              <div className="resume-result-toolbar">
                <span className="resume-result-label">
                  <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Resume ready and saved!
                </span>
                <div className="resume-result-actions">
                  <button onClick={() => downloadPDF(generatedHtml, form.fullName)} className="resume-print-btn">
                    <i className="fas fa-download"></i> Download PDF
                  </button>
                  <button onClick={handleGenerate} disabled={generating} className="resume-regen-btn">
                    <i className="fas fa-redo"></i> Regenerate
                  </button>
                </div>
              </div>
              <div className="resume-preview" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
            </div>
          )}
        </div>
      );

      default: return null;
    }
  };

  // ── Tailor tab ────────────────────────────────────────────────────────────
  const renderTailorTab = () => (
    <div className="resume-step-content">
      <h2 className="resume-step-title"><i className="fas fa-bullseye"></i> Upload &amp; Tailor Resume</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Already have a resume? Upload it or paste the text, enter the target role, and AI will rewrite your summary and bullet points to match your target role — without changing any facts.
      </p>

      <div className="tailor-step-block">
        <div className="tailor-step-number">1</div>
        <div className="tailor-step-body">
          <h3>Upload your resume <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(or paste below)</span></h3>

          <div className="tailor-format-info">
            <i className="fas fa-info-circle"></i>
            <span>
              <strong>.txt</strong>, <strong>.pdf</strong>, and <strong>.docx</strong> are supported.{' '}
              Text will be extracted automatically. For best results, ensure your PDF contains selectable text.
            </span>
          </div>

          <div
            className={`tailor-drop-zone ${tailorFile ? 'has-file' : ''} ${extracting ? 'extracting' : ''}`}
            onClick={() => !extracting && fileInputRef.current?.click()}
          >
            {extracting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#06b6d4' }}></i>
                <p style={{ margin: 0, fontWeight: 600, color: '#0c4a6e' }}>Extracting text…</p>
              </div>
            ) : tailorFile && tailorText ? (
              <div className="tailor-file-info">
                <i className="fas fa-file-check" style={{ color: '#10b981' }}></i>
                <span>{tailorFile.name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  ({tailorText.split(/\s+/).length} words extracted)
                </span>
                <button
                  className="tailor-remove-file"
                  onClick={(e) => { e.stopPropagation(); setTailorFile(null); setTailorText(''); }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : tailorFile && !tailorText ? (
              <div className="tailor-file-info">
                <i className="fas fa-file-alt" style={{ color: '#f59e0b' }}></i>
                <span>{tailorFile.name} — paste text below</span>
                <button
                  className="tailor-remove-file"
                  onClick={(e) => { e.stopPropagation(); setTailorFile(null); setTailorText(''); }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#06b6d4', marginBottom: '0.5rem' }}></i>
                <p style={{ margin: 0, fontWeight: 600 }}>Click to upload your resume</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>.txt, .pdf, .docx supported</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <p style={{ textAlign: 'center', margin: '1rem 0 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            — or paste your resume text directly —
          </p>
          <textarea
            rows={10}
            value={tailorText}
            onChange={(e) => setTailorText(e.target.value)}
            placeholder={"Paste your full resume text here…\n\nJohn Adeyemi\njohn@example.com | Lagos, Nigeria\n\nEXPERIENCE\nSoftware Engineer — Acme Corp (Jan 2022 – Present)\n- Built REST APIs…"}
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
              border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
              color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.875rem',
              lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          {tailorText && (
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
              {tailorText.split(/\s+/).filter(Boolean).length} words ready
            </p>
          )}
        </div>
      </div>

      <div className="tailor-step-block">
        <div className="tailor-step-number">2</div>
        <div className="tailor-step-body">
          <h3>What role are you applying for?</h3>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Product Manager, Backend Engineer, Data Analyst…"
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
              border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
              color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleTailor}
        disabled={tailoring || extracting || !tailorText.trim() || !targetRole.trim()}
        className="resume-generate-btn"
        style={{ marginTop: '0.5rem' }}
      >
        {tailoring
          ? <><i className="fas fa-spinner fa-spin"></i> Tailoring your resume…</>
          : <><i className="fas fa-bullseye"></i> Tailor Resume with AI</>}
      </button>

      {tailoredHtml && (
        <div className="resume-result-section" style={{ marginTop: '1.5rem' }}>
          <div className="resume-result-toolbar">
            <span className="resume-result-label">
              <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> Tailored resume ready and saved!
            </span>
            <div className="resume-result-actions">
              <button onClick={() => downloadPDF(tailoredHtml, targetRole)} className="resume-print-btn">
                <i className="fas fa-download"></i> Download PDF
              </button>
            </div>
          </div>
          <div className="resume-preview" dangerouslySetInnerHTML={{ __html: tailoredHtml }} />
        </div>
      )}
    </div>
  );

  // ── History tab ───────────────────────────────────────────────────────────
  const renderHistoryTab = () => (
    <div className="resume-step-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="resume-step-title" style={{ margin: 0 }}>
          <i className="fas fa-history"></i> My Saved Resumes
        </h2>
        <button onClick={fetchHistory} className="resume-regen-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {viewingResume && (
        <div className="resume-result-section" style={{ marginBottom: '1.5rem' }}>
          <div className="resume-result-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setViewingResume(null)} className="resume-regen-btn">
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <span className="resume-result-label">
                <i className="fas fa-file-alt"></i> {viewingResume.title}
                <span className={`history-type-badge ${viewingResume.resume_type}`} style={{ marginLeft: '0.5rem' }}>
                  {viewingResume.resume_type === 'tailored' ? '🎯 Tailored' : '✨ Generated'}
                </span>
              </span>
            </div>
            <div className="resume-result-actions">
              <button onClick={() => downloadPDF(viewingResume.generated_html, viewingResume.title)} className="resume-print-btn">
                <i className="fas fa-download"></i> Download PDF
              </button>
              <button onClick={() => handleDelete(viewingResume.id)} disabled={deletingId === viewingResume.id} className="resume-regen-btn" style={{ color: '#ef4444' }}>
                {deletingId === viewingResume.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
              </button>
            </div>
          </div>
          <div className="resume-preview" dangerouslySetInnerHTML={{ __html: viewingResume.generated_html }} />
        </div>
      )}

      {!viewingResume && (
        <>
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 80, borderRadius: '0.75rem', background: 'var(--color-border)', animation: 'pulse 1.4s ease infinite' }}></div>
              ))}
            </div>
          ) : savedResumes.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-alt"></i>
              <h3>No saved resumes yet</h3>
              <p>Generate or tailor a resume and it will appear here so you can access it any time.</p>
              <button onClick={() => setActiveTab('build')} className="resume-generate-btn" style={{ width: 'auto', padding: '0.75rem 2rem', margin: '0 auto' }}>
                <i className="fas fa-plus"></i> Build a Resume
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {savedResumes.map((r) => (
                <div key={r.id} className="history-card">
                  <div className="history-card-icon">
                    <i className={`fas ${r.resume_type === 'tailored' ? 'fa-bullseye' : 'fa-file-alt'}`}></i>
                  </div>
                  <div className="history-card-body">
                    <div className="history-card-title">{r.title || 'Resume'}</div>
                    <div className="history-card-meta">
                      <span className={`history-type-badge ${r.resume_type}`}>
                        {r.resume_type === 'tailored' ? '🎯 Tailored' : '✨ Generated'}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="history-card-actions">
                    <button onClick={() => setViewingResume(r)} className="history-view-btn"><i className="fas fa-eye"></i> View</button>
                    <button onClick={() => downloadPDF(r.generated_html, r.title)} className="history-print-btn" title="Download PDF">
                      <i className="fas fa-download"></i>
                    </button>
                    <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="history-delete-btn" title="Delete">
                      {deletingId === r.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="resume-builder-container">
      <div className="resume-page-header">
        <h1><i className="fas fa-file-alt"></i> Resume Builder</h1>
        <p>Build from scratch, tailor your existing resume, or access your saved resumes — all in one place</p>
      </div>

      <div className="resume-top-tabs">
        <button className={`resume-top-tab ${activeTab === 'build' ? 'active' : ''}`} onClick={() => setActiveTab('build')}>
          <i className="fas fa-magic"></i> Build New
        </button>
        <button className={`resume-top-tab ${activeTab === 'tailor' ? 'active' : ''}`} onClick={() => setActiveTab('tailor')}>
          <i className="fas fa-bullseye"></i> Upload &amp; Tailor
        </button>
        <button className={`resume-top-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); fetchHistory(); }}>
          <i className="fas fa-history"></i> My Resumes
          {savedResumes.length > 0 && <span className="tab-count">{savedResumes.length}</span>}
        </button>
      </div>

      {activeTab === 'build' && (
        <>
          <StepIndicator current={step} total={BUILD_STEPS.length} />
          <div className="resume-builder-card">
            {renderBuildStep()}
            <div className="resume-nav-buttons">
              {step > 0 && (
                <button className="resume-nav-btn back" onClick={() => setStep((s) => s - 1)}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              {step < BUILD_STEPS.length - 1 && (
                <button
                  className="resume-nav-btn next"
                  onClick={() => { if (canNext()) setStep((s) => s + 1); else toast.error('Please fill required fields'); }}
                >
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'tailor' && (
        <div className="resume-builder-card">{renderTailorTab()}</div>
      )}

      {activeTab === 'history' && (
        <div className="resume-builder-card">{renderHistoryTab()}</div>
      )}

      <style jsx>{`
        .resume-top-tabs { display:flex; gap:.5rem; margin-bottom:1.5rem; border-bottom:2px solid var(--color-border); padding-bottom:0; }
        .resume-top-tab { display:flex; align-items:center; gap:.4rem; padding:.65rem 1.25rem; border:none; background:none; color:var(--color-text-muted); font-size:.9rem; font-weight:500; cursor:pointer; border-bottom:2.5px solid transparent; margin-bottom:-2px; transition:all .2s; border-radius:.4rem .4rem 0 0; }
        .resume-top-tab:hover { color:var(--color-text); }
        .resume-top-tab.active { color:#06b6d4; border-bottom-color:#06b6d4; font-weight:700; }
        .tab-count { display:inline-flex; align-items:center; justify-content:center; background:#e0f9ff; color:#0891b2; border-radius:1rem; font-size:.72rem; font-weight:700; min-width:20px; height:20px; padding:0 .4rem; }
        .resume-ai-hint { display:flex; align-items:center; gap:.6rem; background:linear-gradient(135deg,#eff6ff,#e0f9ff); border:1px solid #bae6fd; border-radius:.75rem; padding:.75rem 1rem; margin-bottom:1.25rem; font-size:.875rem; color:#0c4a6e; }
        .resume-ai-hint i { color:#06b6d4; font-size:1rem; flex-shrink:0; }

        .tailor-format-info { display:flex; align-items:flex-start; gap:.6rem; background:#fffbeb; border:1px solid #fcd34d; border-radius:.6rem; padding:.65rem .9rem; margin-bottom:.875rem; font-size:.82rem; color:#78350f; line-height:1.5; }
        .tailor-format-info i { color:#f59e0b; flex-shrink:0; margin-top:.1rem; }
        .tailor-step-block { display:flex; gap:1.25rem; margin-bottom:1.75rem; align-items:flex-start; }
        .tailor-step-number { width:36px; height:36px; flex-shrink:0; background:linear-gradient(135deg,#06b6d4,#1e3a8a); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; margin-top:.2rem; }
        .tailor-step-body { flex:1; }
        .tailor-step-body h3 { margin:0 0 .75rem; font-size:1rem; color:var(--color-text); }
        .tailor-drop-zone { border:2px dashed var(--color-border); border-radius:.75rem; padding:2rem; text-align:center; cursor:pointer; transition:all .2s; background:var(--color-bg); margin-bottom:.75rem; }
        .tailor-drop-zone:hover { border-color:#06b6d4; background:#f0fdf9; }
        .tailor-drop-zone.has-file { border-color:#10b981; border-style:solid; background:#f0fdf4; }
        .tailor-drop-zone.extracting { border-color:#06b6d4; border-style:solid; background:#e0f9ff; cursor:default; }
        .tailor-file-info { display:flex; align-items:center; justify-content:center; gap:.75rem; font-weight:600; color:#065f46; flex-wrap:wrap; }
        .tailor-remove-file { background:none; border:none; color:#ef4444; cursor:pointer; padding:.2rem .4rem; border-radius:.3rem; transition:background .2s; }
        .tailor-remove-file:hover { background:#fee2e2; }

        .history-grid { display:flex; flex-direction:column; gap:.75rem; }
        .history-card { display:flex; align-items:center; gap:1rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:.875rem; padding:1rem 1.25rem; transition:all .2s; }
        .history-card:hover { border-color:#06b6d4; box-shadow:0 4px 12px rgba(6,182,212,.1); }
        .history-card-icon { width:44px; height:44px; flex-shrink:0; background:linear-gradient(135deg,#06b6d4,#1e3a8a); border-radius:.75rem; display:flex; align-items:center; justify-content:center; color:white; font-size:1.1rem; }
        .history-card-body { flex:1; min-width:0; }
        .history-card-title { font-weight:700; font-size:.95rem; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:.3rem; }
        .history-card-meta { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
        .history-type-badge { display:inline-flex; align-items:center; padding:.15rem .55rem; border-radius:1rem; font-size:.72rem; font-weight:700; }
        .history-type-badge.generated { background:#dbeafe; color:#1e40af; }
        .history-type-badge.tailored  { background:#ede9fe; color:#6d28d9; }
        .history-card-actions { display:flex; gap:.5rem; align-items:center; flex-shrink:0; }
        .history-view-btn { display:flex; align-items:center; gap:.35rem; padding:.45rem 1rem; background:linear-gradient(135deg,#06b6d4,#1e3a8a); color:white; border:none; border-radius:.5rem; font-size:.82rem; font-weight:600; cursor:pointer; transition:opacity .2s; }
        .history-view-btn:hover { opacity:.85; }
        .history-print-btn, .history-delete-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:.5rem; cursor:pointer; font-size:.85rem; color:var(--color-text-muted); transition:all .2s; }
        .history-print-btn:hover  { border-color:#06b6d4; color:#06b6d4; }
        .history-delete-btn:hover { border-color:#ef4444; color:#ef4444; background:#fee2e2; }
        .history-delete-btn:disabled { opacity:.5; cursor:not-allowed; }

        .resume-result-section {
          margin-top: 1.5rem;
        }
        .resume-result-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .resume-result-label {
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .resume-result-actions {
          display: flex;
          gap: 0.75rem;
        }
        .resume-print-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.25rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 0.6rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: opacity 0.2s;
        }
        .resume-print-btn:hover {
          opacity: 0.9;
        }
        .resume-regen-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.1rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          color: var(--color-text);
          border-radius: 0.6rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .resume-regen-btn:hover {
          border-color: #06b6d4;
          color: #06b6d4;
        }
        .resume-preview {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.875rem;
          padding: 2rem;
          color: #1a1a1a;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        @media(max-width:640px) {
          .resume-top-tabs { overflow-x:auto; white-space:nowrap; }
          .tailor-step-block { flex-direction:column; gap:.75rem; }
          .tailor-step-number { margin-top:0; }
          .history-card { flex-wrap:wrap; }
          .history-card-actions { width:100%; justify-content:flex-end; }
          .resume-result-toolbar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}