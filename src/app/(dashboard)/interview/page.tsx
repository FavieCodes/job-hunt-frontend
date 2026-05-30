'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  question: string;
  tip: string;
}

interface Video {
  title: string;
  url: string;
}

interface PrepResult {
  id: string;
  job_role: string;
  interview_type: string;
  questions: Question[];
  videos: Video[];
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FIELDS = [
  { label: 'Software Engineering',     icon: 'fa-code' },
  { label: 'Data Science & Analytics', icon: 'fa-chart-bar' },
  { label: 'Product Management',       icon: 'fa-layer-group' },
  { label: 'UI/UX Design',             icon: 'fa-paint-brush' },
  { label: 'DevOps & Cloud',           icon: 'fa-server' },
  { label: 'Cybersecurity',            icon: 'fa-shield-alt' },
  { label: 'Marketing',                icon: 'fa-bullhorn' },
  { label: 'Finance & Accounting',     icon: 'fa-coins' },
  { label: 'Human Resources',          icon: 'fa-users' },
  { label: 'Sales',                    icon: 'fa-handshake' },
  { label: 'Healthcare',               icon: 'fa-heartbeat' },
  { label: 'Legal',                    icon: 'fa-gavel' },
  { label: 'Custom…',                  icon: 'fa-edit' },
];

const INTERVIEW_TYPES = [
  { value: 'Technical',        label: 'Technical',        icon: 'fa-laptop-code',   desc: 'Coding, algorithms & system design' },
  { value: 'Behavioral',       label: 'Behavioral',       icon: 'fa-comments',       desc: 'Soft skills & past experience' },
  { value: 'Case Study',       label: 'Case Study',       icon: 'fa-briefcase',      desc: 'Problem-solving & business cases' },
  { value: 'HR / Culture Fit', label: 'HR / Culture Fit', icon: 'fa-user-check',     desc: 'Values, culture & motivation' },
  { value: 'Portfolio Review', label: 'Portfolio Review', icon: 'fa-folder-open',    desc: 'Presenting your previous work' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Form state
  const [selectedField, setSelectedField] = useState('');
  const [customField, setCustomField]       = useState('');
  const [interviewType, setInterviewType]   = useState('');
  const [generating, setGenerating]         = useState(false);

  // Results
  const [result, setResult]   = useState<PrepResult | null>(null);
  const [history, setHistory] = useState<PrepResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const userData = getUser();
    if (!userData) { router.push('/login'); return; }
    // Admin should not access this page
    if (userData.role === 'admin') { router.push('/dashboard'); return; }
    setUser(userData);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/interview/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const resolvedField = selectedField === 'Custom…' ? customField.trim() : selectedField;

  const handleGenerate = async () => {
    if (!resolvedField) {
      toast.error('Please select or enter a field');
      return;
    }
    if (!interviewType) {
      toast.error('Please choose an interview type');
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const { data } = await api.post('/interview/generate', {
        job_role: resolvedField,
        interview_type: interviewType,
      });
      // The API returns the DB row; questions/videos may be JSON strings or already parsed
      const parsed: PrepResult = {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions,
        videos:    typeof data.videos    === 'string' ? JSON.parse(data.videos)    : data.videos,
      };
      setResult(parsed);
      setHistory(prev => [parsed, ...prev]);
      setExpandedQ(null);
      toast.success('Interview prep ready!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate prep. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const loadFromHistory = (item: PrepResult) => {
    const parsed: PrepResult = {
      ...item,
      questions: typeof item.questions === 'string' ? JSON.parse(item.questions) : item.questions,
      videos:    typeof item.videos    === 'string' ? JSON.parse(item.videos)    : item.videos,
    };
    setResult(parsed);
    setActiveTab('generate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* ── Page header ── */}
      <div className="page-header">
        <h1><i className="fas fa-comments"></i> Interview Prep</h1>
        <p>AI-generated practice questions and resources tailored to your target role</p>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
          <i className="fas fa-magic"></i> Generate Prep
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <i className="fas fa-history"></i> My History
          {history.length > 0 && <span className="tab-badge">{history.length}</span>}
        </button>
      </div>

      {/* ════════════════════ GENERATE TAB ════════════════════ */}
      {activeTab === 'generate' && (
        <div className="generate-layout">

          {/* Left — form */}
          <div className="form-panel">

            {/* Step 1 — field */}
            <div className="form-section">
              <h3><span className="step-num">1</span> Choose Your Field</h3>
              <div className="fields-grid">
                {FIELDS.map(f => (
                  <button
                    key={f.label}
                    className={`field-btn ${selectedField === f.label ? 'selected' : ''}`}
                    onClick={() => { setSelectedField(f.label); if (f.label !== 'Custom…') setCustomField(''); }}
                  >
                    <i className={`fas ${f.icon}`}></i>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
              {selectedField === 'Custom…' && (
                <div className="custom-field">
                  <input
                    type="text"
                    placeholder="e.g. Robotics Engineer, Supply Chain Analyst…"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Step 2 — interview type */}
            <div className="form-section">
              <h3><span className="step-num">2</span> Interview Type</h3>
              <div className="types-list">
                {INTERVIEW_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`type-btn ${interviewType === t.value ? 'selected' : ''}`}
                    onClick={() => setInterviewType(t.value)}
                  >
                    <div className="type-icon"><i className={`fas ${t.icon}`}></i></div>
                    <div className="type-info">
                      <span className="type-label">{t.label}</span>
                      <span className="type-desc">{t.desc}</span>
                    </div>
                    {interviewType === t.value && <i className="fas fa-check-circle type-check"></i>}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={generating || !resolvedField || !interviewType}
            >
              {generating ? (
                <><i className="fas fa-spinner fa-spin"></i> Generating your prep…</>
              ) : (
                <><i className="fas fa-magic"></i> Generate Interview Prep</>
              )}
            </button>
          </div>

          {/* Right — results */}
          <div className="results-panel">
            {generating && (
              <div className="generating-state">
                <div className="pulse-ring"></div>
                <i className="fas fa-brain"></i>
                <p>AI is crafting your personalised prep…</p>
                <small>This usually takes 5–15 seconds</small>
              </div>
            )}

            {!generating && !result && (
              <div className="empty-results">
                <i className="fas fa-comments"></i>
                <h3>Ready when you are</h3>
                <p>Pick a field and interview type on the left, then hit Generate.</p>
              </div>
            )}

            {!generating && result && (
              <div className="prep-results">
                <div className="results-header">
                  <div>
                    <h2>{result.job_role}</h2>
                    <span className="results-badge">{result.interview_type} Interview</span>
                  </div>
                  <button className="reset-btn" onClick={() => setResult(null)}>
                    <i className="fas fa-redo"></i> New Prep
                  </button>
                </div>

                {/* Questions */}
                <h4 className="section-label"><i className="fas fa-list-ul"></i> Practice Questions</h4>
                <div className="questions-list">
                  {result.questions.map((q, i) => (
                    <div key={i} className={`question-item ${expandedQ === i ? 'open' : ''}`}>
                      <button className="question-header" onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                        <span className="q-num">{i + 1}</span>
                        <span className="q-text">{q.question}</span>
                        <i className={`fas fa-chevron-${expandedQ === i ? 'up' : 'down'}`}></i>
                      </button>
                      {expandedQ === i && (
                        <div className="question-tip">
                          <i className="fas fa-lightbulb"></i>
                          <p>{q.tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Videos */}
                {result.videos?.length > 0 && (
                  <>
                    <h4 className="section-label" style={{ marginTop: '1.5rem' }}>
                      <i className="fab fa-youtube"></i> Recommended Resources
                    </h4>
                    <div className="videos-list">
                      {result.videos.map((v, i) => (
                        <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="video-card">
                          <div className="video-icon"><i className="fab fa-youtube"></i></div>
                          <div className="video-info">
                            <span className="video-title">{v.title}</span>
                            <span className="video-url">Search on YouTube →</span>
                          </div>
                          <i className="fas fa-external-link-alt video-ext"></i>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ HISTORY TAB ════════════════════ */}
      {activeTab === 'history' && (
        <div className="history-panel">
          {loadingHistory ? (
            <div className="empty-results"><i className="fas fa-spinner fa-spin"></i><p>Loading history…</p></div>
          ) : history.length === 0 ? (
            <div className="empty-results">
              <i className="fas fa-history"></i>
              <h3>No history yet</h3>
              <p>Generate your first interview prep to see it here.</p>
            </div>
          ) : (
            <div className="history-grid">
              {history.map((item) => {
                const qs = typeof item.questions === 'string' ? JSON.parse(item.questions) : item.questions;
                return (
                  <div key={item.id} className="history-card" onClick={() => loadFromHistory(item)}>
                    <div className="history-card-top">
                      <h4>{item.job_role}</h4>
                      <span className="results-badge">{item.interview_type}</span>
                    </div>
                    <p className="history-preview">{qs[0]?.question?.slice(0, 90)}…</p>
                    <div className="history-meta">
                      <span><i className="fas fa-question-circle"></i> {qs.length} questions</span>
                      <span><i className="fas fa-clock"></i> {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .page-header { margin-bottom: 1.5rem; }
        .page-header h1 { font-size: 2rem; color: var(--color-text); margin-bottom: .4rem; }
        .page-header p { color: var(--color-text-muted); }

        /* Tabs */
        .tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--color-border); padding-bottom: .5rem; }
        .tab {
          display: flex; align-items: center; gap: .5rem;
          padding: .6rem 1.25rem; background: none; border: none;
          color: var(--color-text-muted); font-size: .95rem; cursor: pointer;
          border-radius: .5rem .5rem 0 0; transition: all .2s; position: relative;
        }
        .tab.active { color: var(--color-primary, #06b6d4); font-weight: 600; background: var(--color-surface); }
        .tab-badge {
          background: var(--color-primary, #06b6d4); color: white;
          border-radius: 9999px; padding: .1rem .45rem; font-size: .7rem; font-weight: 700;
        }

        /* Generate layout */
        .generate-layout { display: grid; grid-template-columns: 420px 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 900px) { .generate-layout { grid-template-columns: 1fr; } }

        /* Form panel */
        .form-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; }
        .form-section { margin-bottom: 1.75rem; }
        .form-section h3 {
          display: flex; align-items: center; gap: .6rem;
          font-size: 1rem; color: var(--color-text); margin-bottom: 1rem;
        }
        .step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; background: var(--color-primary, #06b6d4);
          color: white; border-radius: 50%; font-size: .75rem; font-weight: 700; flex-shrink: 0;
        }

        /* Fields grid */
        .fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem; }
        .field-btn {
          display: flex; align-items: center; gap: .5rem;
          padding: .55rem .75rem; background: var(--color-bg);
          border: 1px solid var(--color-border); border-radius: .6rem;
          color: var(--color-text-muted); font-size: .82rem; cursor: pointer;
          transition: all .2s; text-align: left;
        }
        .field-btn i { font-size: .9rem; flex-shrink: 0; }
        .field-btn:hover { border-color: var(--color-primary, #06b6d4); color: var(--color-primary, #06b6d4); }
        .field-btn.selected { border-color: var(--color-primary, #06b6d4); background: #e0f9ff; color: #0e7490; font-weight: 600; }
        .custom-field { margin-top: .75rem; }
        .custom-field input {
          width: 100%; padding: .65rem .9rem; background: var(--color-bg);
          border: 1px solid var(--color-primary, #06b6d4); border-radius: .6rem;
          color: var(--color-text); font-size: .95rem; outline: none;
          box-sizing: border-box;
        }

        /* Interview types */
        .types-list { display: flex; flex-direction: column; gap: .5rem; }
        .type-btn {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem 1rem; background: var(--color-bg);
          border: 1px solid var(--color-border); border-radius: .7rem;
          cursor: pointer; transition: all .2s; text-align: left;
        }
        .type-btn:hover { border-color: var(--color-primary, #06b6d4); }
        .type-btn.selected { border-color: var(--color-primary, #06b6d4); background: #e0f9ff; }
        .type-icon {
          width: 36px; height: 36px; border-radius: .5rem;
          background: var(--color-surface); display: flex; align-items: center; justify-content: center;
          color: var(--color-primary, #06b6d4); font-size: 1rem; flex-shrink: 0;
        }
        .type-info { flex: 1; display: flex; flex-direction: column; gap: .15rem; }
        .type-label { font-size: .9rem; font-weight: 600; color: var(--color-text); }
        .type-desc  { font-size: .75rem; color: var(--color-text-muted); }
        .type-check { color: #10b981; font-size: 1.1rem; }

        /* Generate button */
        .generate-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: .6rem;
          padding: .85rem; background: var(--color-primary, #06b6d4); color: white;
          border: none; border-radius: .75rem; font-size: 1rem; font-weight: 600; cursor: pointer;
          transition: all .2s;
        }
        .generate-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .generate-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        /* Results panel */
        .results-panel {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 1rem; padding: 1.5rem; min-height: 400px;
          display: flex; flex-direction: column;
        }

        /* Generating state */
        .generating-state {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: .75rem; color: var(--color-text-muted);
          text-align: center;
        }
        .generating-state i.fa-brain { font-size: 2.5rem; color: var(--color-primary, #06b6d4); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .pulse-ring {
          width: 70px; height: 70px; border-radius: 50%;
          border: 3px solid var(--color-primary, #06b6d4);
          animation: ring 1.5s infinite; position: absolute;
        }
        @keyframes ring { 0% { transform: scale(.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }

        /* Empty results */
        .empty-results {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: .75rem; color: var(--color-text-muted); text-align: center;
        }
        .empty-results i { font-size: 3rem; opacity: .3; }
        .empty-results h3 { font-size: 1.1rem; color: var(--color-text); }

        /* Prep results */
        .prep-results { width: 100%; }
        .results-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 1.25rem; gap: 1rem;
        }
        .results-header h2 { font-size: 1.3rem; color: var(--color-text); margin-bottom: .4rem; }
        .results-badge {
          display: inline-block; padding: .25rem .75rem;
          background: #e0f9ff; color: #0e7490;
          border-radius: 2rem; font-size: .78rem; font-weight: 600;
        }
        .reset-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .5rem 1rem; background: var(--color-bg);
          border: 1px solid var(--color-border); border-radius: .6rem;
          color: var(--color-text-muted); cursor: pointer; font-size: .85rem;
          transition: all .2s; white-space: nowrap;
        }
        .reset-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .section-label { display: flex; align-items: center; gap: .5rem; color: var(--color-text); font-size: .95rem; margin-bottom: .75rem; }
        .section-label i { color: var(--color-primary, #06b6d4); }

        /* Questions accordion */
        .questions-list { display: flex; flex-direction: column; gap: .5rem; }
        .question-item { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: .75rem; overflow: hidden; }
        .question-item.open { border-color: var(--color-primary, #06b6d4); }
        .question-header {
          width: 100%; display: flex; align-items: center; gap: .75rem;
          padding: .85rem 1rem; background: none; border: none; cursor: pointer;
          text-align: left; color: var(--color-text);
        }
        .q-num {
          min-width: 26px; height: 26px; border-radius: 50%;
          background: var(--color-primary, #06b6d4); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; font-weight: 700;
        }
        .q-text { flex: 1; font-size: .9rem; line-height: 1.4; }
        .question-header .fa-chevron-up, .question-header .fa-chevron-down { color: var(--color-text-muted); font-size: .8rem; }
        .question-tip {
          display: flex; align-items: flex-start; gap: .65rem;
          padding: .85rem 1rem; background: #f0fdf4;
          border-top: 1px solid #bbf7d0;
        }
        .question-tip i { color: #16a34a; font-size: 1rem; margin-top: .1rem; flex-shrink: 0; }
        .question-tip p { font-size: .875rem; color: #166534; line-height: 1.5; margin: 0; }

        /* Videos */
        .videos-list { display: flex; flex-direction: column; gap: .5rem; }
        .video-card {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem 1rem; background: var(--color-bg);
          border: 1px solid var(--color-border); border-radius: .75rem;
          text-decoration: none; transition: all .2s;
        }
        .video-card:hover { border-color: #ef4444; background: #fff5f5; }
        .video-icon {
          width: 36px; height: 36px; border-radius: .5rem;
          background: #fee2e2; display: flex; align-items: center; justify-content: center;
          color: #ef4444; font-size: 1rem; flex-shrink: 0;
        }
        .video-info { flex: 1; display: flex; flex-direction: column; gap: .15rem; }
        .video-title { font-size: .9rem; font-weight: 600; color: var(--color-text); }
        .video-url   { font-size: .75rem; color: var(--color-text-muted); }
        .video-ext   { color: var(--color-text-muted); font-size: .8rem; }

        /* History */
        .history-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; }
        .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .history-card {
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: .75rem; padding: 1.25rem; cursor: pointer;
          transition: all .2s;
        }
        .history-card:hover { border-color: var(--color-primary, #06b6d4); transform: translateY(-2px); }
        .history-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; margin-bottom: .6rem; }
        .history-card h4 { font-size: .95rem; color: var(--color-text); margin: 0; }
        .history-preview { font-size: .82rem; color: var(--color-text-muted); line-height: 1.45; margin-bottom: .75rem; }
        .history-meta { display: flex; gap: 1rem; font-size: .78rem; color: var(--color-text-muted); }
        .history-meta span { display: flex; align-items: center; gap: .3rem; }
      `}</style>
    </div>
  );
}