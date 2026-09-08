import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Spinner, ErrorText, Markdown } from '../../components/common';

export default function TestRunner() {
  const { id } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | locked | active | result
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({});   // itemId -> { answerText?, selectedOptionId? }
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadResult = useCallback(async () => {
    const r = await api(`/tests/${id}/result`);
    setResult(r);
    setPhase('result');
  }, [id]);

  const loadItems = useCallback(async () => {
    const d = await api(`/tests/${id}/items`);
    setItems(d.items);
    setPhase('active');
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        // Already submitted? show the result. Otherwise try to load items
        // (works if already unlocked); else fall to the locked screen.
        try { await loadResult(); return; } catch { /* not submitted */ }
        try { await loadItems(); return; } catch { /* not unlocked */ }
        setPhase('locked');
      } catch (e) { setError(e); setPhase('locked'); }
    })();
  }, [loadItems, loadResult]);

  async function unlock(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api(`/tests/${id}/unlock`, { method: 'POST', body: { code: code.trim() } });
      await loadItems();
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  function setAnswer(itemId, patch) {
    setAnswers((a) => ({ ...a, [itemId]: { ...a[itemId], ...patch } }));
  }

  async function save() {
    const payload = Object.entries(answers).map(([itemId, v]) => ({ itemId: Number(itemId), ...v }));
    if (payload.length) await api(`/tests/${id}/answers`, { method: 'PUT', body: { answers: payload } });
  }

  async function submit() {
    if (!confirm('Submit the test? You cannot change your answers afterwards.')) return;
    setBusy(true); setError(null);
    try {
      await save();
      await api(`/tests/${id}/submit`, { method: 'POST' });
      await loadResult();
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  if (phase === 'loading') return <Spinner />;

  if (phase === 'locked') {
    return (
      <div className="center">
        <form className="card stack" style={{ width: 360 }} onSubmit={unlock}>
          <h2>Enter access code</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Your instructor issued you a one-time code for this test. It is separate
            from your login and expires after a set time.
          </p>
          <input
            autoFocus value={code} placeholder="XXXXX-XXXXX"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <ErrorText error={error} />
          <button disabled={busy}>{busy ? 'Unlocking…' : 'Unlock test'}</button>
          <Link to="/tests" className="muted" style={{ fontSize: 13 }}>← Back to tests</Link>
        </form>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="container">
        <h1>Result</h1>
        {result.status !== 'graded'
          ? <p className="badge warn">Submitted — awaiting grading</p>
          : <p style={{ fontSize: 22 }}><strong>{result.score}</strong> / {result.maxScore}</p>}
        <div className="card">
          <table>
            <thead><tr><th>#</th><th>Type</th><th>Score</th><th>Cases</th></tr></thead>
            <tbody>
              {result.results.map((r, i) => (
                <tr key={r.item_id}>
                  <td>{i + 1}</td>
                  <td>{r.type}</td>
                  <td>{r.points_awarded}/{r.points_possible}
                    {r.needs_manual_review ? ' *' : ''}</td>
                  <td>{r.cases_total ? `${r.cases_passed}/${r.cases_total}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: 12 }}>* pending manual review</p>
        </div>
        <Link to="/tests">← Back to tests</Link>
      </div>
    );
  }

  // active
  return (
    <div className="container">
      <h1>Test in progress</h1>
      <ErrorText error={error} />
      {items.map((it, idx) => (
        <div className="card" key={it.id}>
          <div className="muted" style={{ fontSize: 12 }}>
            Question {idx + 1} · {it.points} pt{it.points > 1 ? 's' : ''} · {it.type}
          </div>
          <Markdown>{it.prompt_md}</Markdown>

          {it.type === 'mcq' && (
            <div className="stack">
              {it.options.map((o) => (
                <label key={o.id} style={{ fontWeight: 400, display: 'flex', gap: 8 }}>
                  <input
                    type="radio" name={`q${it.id}`} style={{ width: 'auto' }}
                    checked={answers[it.id]?.selectedOptionId === o.id}
                    onChange={() => setAnswer(it.id, { selectedOptionId: o.id })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          )}

          {(it.type === 'short_answer') && (
            <input
              value={answers[it.id]?.answerText || ''}
              onChange={(e) => setAnswer(it.id, { answerText: e.target.value })}
            />
          )}

          {(it.type === 'coding' || it.type === 'query') && (
            <>
              {it.sampleCases?.length > 0 && (
                <details>
                  <summary className="muted">Sample cases</summary>
                  {it.sampleCases.map((c) => (
                    <pre key={c.id}>stdin: {c.stdin || '(none)'}
{'\n'}expected: {c.expected_stdout}</pre>
                  ))}
                </details>
              )}
              <textarea
                spellCheck={false}
                value={answers[it.id]?.answerText ?? it.starter_code ?? ''}
                onChange={(e) => setAnswer(it.id, { answerText: e.target.value })}
              />
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="secondary" onClick={save} disabled={busy}>Save draft</button>
        <button onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit test'}</button>
      </div>
    </div>
  );
}
