import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText, Markdown, MarkdownInline } from '../../components/common';

/**
 * Module "Check Your Understanding" quiz — part of course delivery.
 * Retakeable, immediate feedback with explanations. Passing marks the module
 * complete (handled server-side).
 */
export default function ModuleQuiz() {
  const { slug, moduleId } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useFetch(`/catalog/modules/${moduleId}/quiz`, [moduleId]);

  const [answers, setAnswers] = useState({});   // questionId -> Set(optionId)
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  const quiz = data.quiz;

  function toggle(qId, optId, multi) {
    setAnswers((prev) => {
      const cur = new Set(prev[qId] || []);
      if (multi) {
        cur.has(optId) ? cur.delete(optId) : cur.add(optId);
      } else {
        cur.clear();
        cur.add(optId);
      }
      return { ...prev, [qId]: cur };
    });
  }

  async function submit() {
    setBusy(true); setSubmitError(null);
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        optionIds: [...(answers[q.id] || [])],
      }));
      const r = await api(`/catalog/modules/${moduleId}/quiz/submit`, {
        method: 'POST', body: { answers: payload },
      });
      setResult(r);
      window.scrollTo(0, 0);
    } catch (e) { setSubmitError(e); } finally { setBusy(false); }
  }

  function retake() {
    setAnswers({});
    setResult(null);
  }

  const answeredAll = quiz.questions.every((q) => (answers[q.id]?.size ?? 0) > 0);
  const detailByQ = result
    ? Object.fromEntries(result.detail.map((d) => [d.questionId, d]))
    : {};

  return (
    <div className="container">
      <p className="muted"><Link to={`/tracks/${slug}?m=${moduleId}`}>← Back to module</Link></p>
      <h1>{quiz.title}</h1>

      {result && (
        <div
          className="card"
          style={{
            background: result.passed ? 'var(--ok-weak)' : 'var(--err-weak)',
            borderColor: result.passed ? 'var(--ok)' : 'var(--err)',
          }}
        >
          <h2 style={{ margin: '0 0 4px' }}>
            {result.score} / {result.maxScore} &nbsp;({result.percent}%)
          </h2>
          <p style={{ margin: 0 }}>
            {result.passed
              ? (
                <>
                  <span className="badge ok">Passed</span>{' '}
                  {result.moduleCompleted
                    ? '— every lesson is done too, so this module is now complete.'
                    : `— now open the ${result.lessonsRemaining} remaining lesson${result.lessonsRemaining === 1 ? '' : 's'} to finish the module.`}
                </>
              )
              : <><span className="badge err">Not passed</span> — you need {result.passPercent}%. Review the explanations and retake.</>}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="secondary" onClick={retake}>Retake quiz</button>
            <button onClick={() => navigate(`/tracks/${slug}?m=${moduleId}`)}>Back to module</button>
          </div>
        </div>
      )}

      {!result && quiz.lastAttempt && (
        <p className="muted">
          Last attempt: {quiz.lastAttempt.percent}%
          {quiz.lastAttempt.passed ? ' (passed)' : ''} · {quiz.lastAttempt.attempts} attempt(s)
        </p>
      )}

      <ErrorText error={submitError} />

      {quiz.questions.map((q, idx) => {
        const d = detailByQ[q.id];
        const picked = answers[q.id] || new Set();
        return (
          <div
            className="card"
            key={q.id}
            style={d ? { borderLeft: `4px solid ${d.correct ? 'var(--ok)' : 'var(--err)'}` } : undefined}
          >
            <div className="muted" style={{ fontSize: 12 }}>
              Question {idx + 1} of {quiz.questions.length}
              {q.type === 'multi' ? ' · select all that apply' : ''}
              {d && (d.correct ? ' · correct' : ' · incorrect')}
            </div>
            <Markdown>{q.promptMd}</Markdown>
            <div className="stack">
              {q.options.map((o) => {
                const isPicked = picked.has(o.id);
                const isKey = d && d.correctOptionIds.includes(o.id);
                let bg;
                if (d) {
                  if (isKey) bg = 'var(--ok-weak)';
                  else if (isPicked) bg = 'var(--err-weak)';
                }
                return (
                  <label
                    key={o.id}
                    style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'flex-start',
                      background: bg, padding: '4px 6px', borderRadius: 6 }}
                  >
                    <input
                      type={q.type === 'multi' ? 'checkbox' : 'radio'}
                      name={`q${q.id}`}
                      style={{ width: 'auto', marginTop: 3 }}
                      disabled={!!result}
                      checked={isPicked}
                      onChange={() => toggle(q.id, o.id, q.type === 'multi')}
                    />
                    <span><MarkdownInline>{o.label}</MarkdownInline>{d && isKey ? '  ✓' : ''}</span>
                  </label>
                );
              })}
            </div>
            {d && d.explanationMd && (
              <p className="muted" style={{ marginTop: 10, fontStyle: 'italic' }}>{d.explanationMd}</p>
            )}
          </div>
        );
      })}

      {!result && (
        <button onClick={submit} disabled={busy || !answeredAll}>
          {busy ? 'Submitting…' : answeredAll ? 'Submit quiz' : 'Answer every question to submit'}
        </button>
      )}
    </div>
  );
}
