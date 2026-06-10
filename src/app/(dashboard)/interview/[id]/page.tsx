'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { PrepResult } from '@/lib';

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [prep, setPrep] = useState<PrepResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<number, string>>({});
  const [loadingAnswer, setLoadingAnswer] = useState<number | null>(null);

  useEffect(() => {
    if (id) fetchInterviewPrep();
  }, [id]);

  const fetchInterviewPrep = async () => {
    try {
      const { data } = await api.get(`/interview/${id}`);
      const parsed: PrepResult = {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions,
        videos: typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos,
      };
      setPrep(parsed);
    } catch (error) {
      toast.error('Failed to load interview prep');
      router.push('/interview');
    } finally {
      setLoading(false);
    }
  };

  const generateAnswer = async (question: string, tip: string, index: number) => {
    if (aiAnswers[index]) return; // already loaded
    setLoadingAnswer(index);
    try {
      const { data } = await api.post('/interview/generate-answer', {
        question,
        tip,
        job_role: prep?.job_role,
        interview_type: prep?.interview_type,
      });
      setAiAnswers((prev) => ({ ...prev, [index]: data.answer }));
    } catch {
      setAiAnswers((prev) => ({ ...prev, [index]: 'Could not generate an answer. Please try again.' }));
    } finally {
      setLoadingAnswer(null);
    }
  };

  // Auto-generate answer when a question is expanded
  const handleExpandQ = (i: number, question: string, tip: string) => {
    const next = expandedQ === i ? null : i;
    setExpandedQ(next);
    if (next !== null && !aiAnswers[i]) {
      generateAnswer(question, tip, i);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div className="skeleton-card" style={{ height: '400px', borderRadius: '1rem' }}></div>
      </div>
    );
  }

  if (!prep) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back link */}
      <div className="back-row">
        <button onClick={() => router.back()} className="back-btn">
          <i className="fas fa-arrow-left"></i> Back to History
        </button>
        <Link href="/interview" className="new-prep-link">
          <i className="fas fa-plus"></i> New Prep
        </Link>
      </div>

      {/* Header */}
      <div className="detail-header">
        <div>
          <h1 className="job-role-title">{prep.job_role}</h1>
          <span className="interview-type-badge">{prep.interview_type} Interview</span>
        </div>
        <div className="detail-meta-info">
          <span><i className="fas fa-calendar-alt"></i> {new Date(prep.created_at).toLocaleDateString()}</span>
          <span><i className="fas fa-question-circle"></i> {prep.questions.length} questions</span>
          {prep.videos?.length > 0 && <span><i className="fab fa-youtube"></i> {prep.videos.length} resources</span>}
        </div>
      </div>

      {/* Questions Section */}
      <div className="detail-card">
        <h2 className="section-heading">
          <i className="fas fa-list-ul"></i> Practice Questions
        </h2>
        <div className="questions-list">
          {prep.questions.map((q, i) => (
            <div key={i} className={`question-item ${expandedQ === i ? 'open' : ''}`}>
              <div className="question-header" onClick={() => handleExpandQ(i, q.question, q.tip)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handleExpandQ(i, q.question, q.tip)}>
                <span className="q-num">{i + 1}</span>
                <span className="q-text">{q.question}</span>
                <div className="question-actions">
                  <button 
                    className="copy-btn" 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(q.question); }}
                    title="Copy question"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                  <i className={`fas fa-chevron-${expandedQ === i ? 'up' : 'down'}`}></i>
                </div>
              </div>
              {expandedQ === i && (
                <div className="question-expanded">
                  {/* Tip row */}
                  <div className="question-tip">
                    <i className="fas fa-lightbulb"></i>
                    <div style={{ flex: 1 }}>
                      <strong>💡 Tip:</strong>
                      <p>{q.tip}</p>
                    </div>
                    <button
                      className="copy-tip-btn"
                      onClick={() => copyToClipboard(q.tip)}
                      title="Copy tip"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>

                  {/* AI Answer row */}
                  <div className="ai-answer-section">
                    <div className="ai-answer-header">
                      <i className="fas fa-robot"></i>
                      <span>AI Sample Answer</span>
                      {aiAnswers[i] && (
                        <button
                          className="copy-tip-btn"
                          onClick={() => copyToClipboard(aiAnswers[i])}
                          title="Copy answer"
                          style={{ marginLeft: 'auto' }}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      )}
                    </div>
                    {loadingAnswer === i ? (
                      <div className="ai-answer-loading">
                        <i className="fas fa-spinner fa-spin"></i> Generating answer…
                      </div>
                    ) : aiAnswers[i] ? (
                      <p className="ai-answer-text">{aiAnswers[i]}</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Videos Section */}
      {prep.videos?.length > 0 && (
        <div className="detail-card">
          <h2 className="section-heading">
            <i className="fab fa-youtube"></i> Recommended Resources
          </h2>
          <div className="videos-list">
            {prep.videos.map((v, i) => (
              <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="video-card">
                <div className="video-icon"><i className="fab fa-youtube"></i></div>
                <div className="video-info">
                  <span className="video-title">{v.title}</span>
                  <span className="video-url">Watch on YouTube →</span>
                </div>
                <i className="fas fa-external-link-alt video-ext"></i>
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .back-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: .5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: .9rem;
          transition: color .2s;
        }
        .back-btn:hover {
          color: var(--color-primary);
        }
        .new-prep-link {
          display: flex;
          align-items: center;
          gap: .5rem;
          padding: .5rem 1rem;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          color: white;
          border-radius: .6rem;
          text-decoration: none;
          font-size: .85rem;
          font-weight: 600;
          transition: opacity .2s;
        }
        .new-prep-link:hover {
          opacity: .9;
        }
        .detail-header {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .job-role-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: .5rem;
          word-break: break-word;
        }
        .interview-type-badge {
          display: inline-block;
          padding: .25rem .75rem;
          background: #e0f9ff;
          color: #0e7490;
          border-radius: 2rem;
          font-size: .8rem;
          font-weight: 600;
        }
        .detail-meta-info {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          font-size: .85rem;
          color: var(--color-text-muted);
        }
        .detail-meta-info i {
          margin-right: .3rem;
          color: #06b6d4;
        }
        .detail-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .section-heading {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: .5rem;
          margin-bottom: 1rem;
          padding-bottom: .6rem;
          border-bottom: 2px solid var(--color-border);
        }
        .section-heading i {
          color: #06b6d4;
        }
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }
        .question-item {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: .75rem;
          overflow: hidden;
        }
        .question-item.open {
          border-color: #06b6d4;
        }
        .question-header { cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          color: var(--color-text);
        }
        .q-num {
          min-width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #06b6d4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .75rem;
          font-weight: 700;
        }
        .q-text {
          flex: 1;
          font-size: .9rem;
          line-height: 1.4;
          word-break: break-word;
        }
        .question-actions {
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        .copy-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: .3rem;
          border-radius: .4rem;
          transition: all .2s;
        }
        .copy-btn:hover {
          background: var(--color-surface);
          color: #06b6d4;
        }
        .question-header .fa-chevron-up,
        .question-header .fa-chevron-down {
          color: var(--color-text-muted);
          font-size: .8rem;
          flex-shrink: 0;
        }
        .question-tip {
          display: flex;
          align-items: flex-start;
          gap: .75rem;
          padding: 1rem;
          background: #f0fdf4;
          border-top: 1px solid #bbf7d0;
        }
        .question-tip i {
          color: #16a34a;
          font-size: 1rem;
          margin-top: .1rem;
          flex-shrink: 0;
        }
        .question-tip div {
          flex: 1;
        }
        .question-tip strong {
          font-size: .8rem;
          color: #166534;
        }
        .question-tip p {
          font-size: .875rem;
          color: #166534;
          line-height: 1.5;
          margin: .25rem 0 0;
          word-break: break-word;
        }
        .copy-tip-btn {
          background: none;
          border: none;
          color: #166534;
          cursor: pointer;
          padding: .3rem;
          border-radius: .4rem;
          transition: all .2s;
          opacity: .7;
        }
        .copy-tip-btn:hover {
          opacity: 1;
          background: rgba(22, 101, 52, 0.1);
        }
        .videos-list {
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        .video-card {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .75rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: .75rem;
          text-decoration: none;
          transition: all .2s;
        }
        .video-card:hover {
          border-color: #ef4444;
          background: #fff5f5;
        }
        .video-icon {
          width: 36px;
          height: 36px;
          border-radius: .5rem;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .video-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: .15rem;
          min-width: 0;
        }
        .video-title {
          font-size: .9rem;
          font-weight: 600;
          color: var(--color-text);
          word-break: break-word;
        }
        .video-url {
          font-size: .75rem;
          color: var(--color-text-muted);
        }
        .video-ext {
          color: var(--color-text-muted);
          font-size: .8rem;
          flex-shrink: 0;
        }
        .question-expanded { border-top: 1px solid var(--color-border); }
        .ai-answer-section {
          padding: 1rem;
          background: #f0f4ff;
          border-top: 1px solid #c7d7fe;
        }
        .ai-answer-header {
          display: flex;
          align-items: center;
          gap: .5rem;
          font-size: .8rem;
          font-weight: 700;
          color: #3730a3;
          margin-bottom: .6rem;
        }
        .ai-answer-header i { color: #6366f1; font-size: .95rem; }
        .ai-answer-text {
          font-size: .875rem;
          color: #1e1b4b;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }
        .ai-answer-loading {
          font-size: .85rem;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        @media (max-width: 640px) {
          .job-role-title {
            font-size: 1.3rem;
          }
          .detail-meta-info {
            flex-wrap: wrap;
          }
          .question-header {
            flex-wrap: wrap;
          }
          .question-actions {
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
}