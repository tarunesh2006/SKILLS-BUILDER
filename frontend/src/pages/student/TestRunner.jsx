import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Spinner, ErrorText, Markdown } from '../../components/common';

function fmtClock(ms) {
  if (ms == null) return null;
  if (ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const VERDICT = {
  accepted: { label: 'Accepted', cls: 'ok' },
  partial: { label: 'Partial', cls: 'warn' },
  wrong: { label: 'Wrong answer', cls: 'err' },
  compile_error: { label: 'Compile error', cls: 'err' },
  pending_review: { label: 'Pending review', cls: 'warn' },
};

function Verdict({ v }) {
  const m = VERDICT[v] || { label: v, cls: '' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

/* ---- one question ---- */
function ItemPanel({ testId, item, index, onScored }) {
  const isCoding = item.type === 'coding';
  const [answerText, setAnswerText] = useState(
    item.my?.answerText ?? item.starter_code ?? '',
  );
  const [optionId, setOptionId] = useState(item.my?.selectedOptionId ?? null);
  const [runOut, setRunOut] = useState(null);
  const [subOut, setSubOut] = useState(
    item.my
      ? {
        verdict: item.my.pointsAwarded >= item.my.pointsPossible && item.my.pointsPossible > 0
          ? 'accepted' : item.my.pointsAwarded > 0 ? 'partial' : 'wrong',
        pointsAwarded: item.my.pointsAwarded,
        pointsPossible: item.my.pointsPossible,
        casesPassed: item.my.casesPassed,
        casesTotal: item.my.casesTotal,
        needsManualReview: item.my.needsManualReview,
      }
      : null,
  );
  const [busy, setBusy] = useState(null); // 'run' | 'submit'
  const [error, setError] = useState(null);

  async function run() {
    setBusy('run'); setError(null); setRunOut(null);
    try {
      const out = await api(`/tests/${testId}/items/${item.id}/run`, {
        method: 'POST', body: { source: answerText },
      });
      setRunOut(out);
    } catch (e) { setError(e); } finally { setBusy(null); }
  }

  async function submit() {
    setBusy('submit'); setError(null);
    try {
      const body = isCoding || item.type === 'short_answer' || item.type === 'query'
        ? { answerText }
        : { selectedOptionId: optionId };
      const out = await api(`/tests/${testId}/items/${item.id}/submit`, { method: 'POST', body });
      setSubOut(out);
      onScored(out);
    } catch (e) { setError(e); } finally { setBusy(null); }
  }

  const canSubmit = isCoding || item.type === 'short_answer' || item.type === 'query'
    ? answerText.trim().length > 0
    : optionId != null;

  return (
    <div className="card qpanel">
      <div className="qpanel__head">
        <strong>Question {index + 1}</strong>
        <span className="muted">{item.points} pt{item.points === 1 ? '' : 's'} · {item.type}</span>
        {subOut && (
          <span className="qpanel__score">
            Best: {subOut.pointsAwarded}/{subOut.pointsPossible ?? item.points}
          </span>
        )}
      </div>

      <Markdown>{item.prompt_md}</Markdown>

      {item.type === 'mcq' && (
        <div className="stack">
          {item.options.map((o) => (
            <label key={o.id} className="qopt">
              <input
                type="radio" name={`q${item.id}`}
                checked={optionId === o.id}
                onChange={() => setOptionId(o.id)}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}

      {(item.type === 'short_answer' || item.type === 'query') && (
        <textarea
          className={item.type === 'query' ? 'mono' : ''}
          value={answerText}
          placeholder={item.type === 'query' ? 'Write your query…' : 'Your answer…'}
          onChange={(e) => setAnswerText(e.target.value)}
        />
      )}

      {isCoding && (
        <>
          {item.sampleCases?.length > 0 && (
            <details className="qpanel__samples">
              <summary>Sample cases ({item.sampleCases.length})</summary>
              {item.sampleCases.map((c) => (
                <pre key={c.id}>{`input:
${c.stdin || '(none)'}
expected:
${c.expected_stdout}`}</pre>
              ))}
            </details>
          )}
          <textarea
            className="mono qpanel__editor"
            spellCheck={false}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
        </>
      )}

      <ErrorText error={error} />

      <div className="qpanel__actions">
        {isCoding && (
          <button className="secondary" onClick={run} disabled={busy != null || !answerText.trim()}>
            {busy === 'run' ? 'Running…' : 'Run sample cases'}
          </button>
        )}
        <button onClick={submit} disabled={busy != null || !canSubmit}>
          {busy === 'submit' ? 'Submitting…' : subOut ? 'Submit again' : 'Submit'}
        </button>
        <span className="muted qpanel__hint">Multiple submissions allowed — your best score is kept.</span>
      </div>

      {runOut && (
        <div className="qpanel__out">
          <strong>
            Run: {runOut.casesPassed}/{runOut.casesTotal} sample cases passed
          </strong>
          {runOut.compileError && <pre>{runOut.compileError}</pre>}
          {runOut.cases?.map((c) => (
            <div key={c.caseId} className={`qcase ${c.passed ? 'is-pass' : 'is-fail'}`}>
              <span>{c.passed ? '✓' : '✗'} case</span>
              {!c.passed && c.expected != null && (
                <pre>{`expected: ${c.expected}\ngot:      ${c.actual ?? ''}`}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {subOut && (
        <div className="qpanel__out">
          <Verdict v={subOut.verdict} />{' '}
          <strong>{subOut.pointsAwarded}/{subOut.pointsPossible ?? item.points} pts</strong>
          {subOut.casesTotal != null && (
            <span className="muted"> · {subOut.casesPassed}/{subOut.casesTotal} cases</span>
          )}
          {subOut.compileError && <pre>{subOut.compileError}</pre>}
          {subOut.needsManualReview && (
            <p className="muted" style={{ fontSize: 13 }}>Flagged for manual review by your instructor.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- leaderboard tab ---- */
function Leaderboard({ testId }) {
  const [rows, setRows] = useState(null);
  const [meId, setMeId] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api(`/tests/${testId}/leaderboard`)
      .then((d) => { setRows(d.leaderboard); setMeId(d.me); })
      .catch(setError);
  }, [testId]);

  if (error) return <ErrorText error={error} />;
  if (!rows) return <Spinner />;
  if (rows.length === 0) return <p className="muted">No scores yet.</p>;

  return (
    <table>
      <thead><tr><th>#</th><th>Participant</th><th>Score</th><th>Time penalty</th><th>Subs</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.studentId} className={r.studentId === meId ? 'lb-me' : ''}>
            <td>{r.rank}</td>
            <td>{r.name}{r.studentId === meId ? ' (you)' : ''}</td>
            <td>{r.score}/{r.maxScore}</td>
            <td className="muted">{r.penaltySeconds}s</td>
            <td className="muted">{r.submissions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TestRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading'); // loading | intro | active | result
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('questions');
  const [totals, setTotals] = useState({ score: 0, maxScore: 0 });
  const [busy, setBusy] = useState(false);
  const [endsAt, setEndsAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef(null);

  const loadItems = useCallback(async () => {
    const d = await api(`/tests/${id}/items`);
    setItems(d.items);
    const score = d.items.reduce((a, it) => a + (it.my?.pointsAwarded || 0), 0);
    const maxScore = d.items.reduce((a, it) => a + it.points, 0);
    setTotals({ score, maxScore });
  }, [id]);

  const loadResult = useCallback(async () => {
    const r = await api(`/tests/${id}/result`);
    setResult(r);
  }, [id]);

  const refresh = useCallback(async () => {
    try {
      const d = await api(`/tests/${id}`);
      setDetail(d);
      const p = d.participation;
      if (p && (p.status === 'submitted' || p.status === 'graded')) {
        await loadResult();
        setPhase('result');
      } else if (p && p.status === 'in_progress') {
        setEndsAt(p.endsAt || null);
        await loadItems();
        setPhase('active');
      } else {
        setPhase('intro');
      }
    } catch (e) {
      setError(e);
      setPhase('intro');
    }
  }, [id, loadItems, loadResult]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (phase !== 'active') return undefined;
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, [phase]);

  // auto-finish when the clock runs out
  useEffect(() => {
    if (phase === 'active' && endsAt && now >= endsAt) {
      finish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, endsAt, phase]);

  async function start() {
    setBusy(true); setError(null);
    try {
      await api(`/tests/${id}/start`, { method: 'POST', body: {} });
      await refresh();
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  async function finish(auto = false) {
    if (!auto && !confirm('Finish and submit this test? You will not be able to make more submissions.')) return;
    setBusy(true); setError(null);
    try {
      await api(`/tests/${id}/finish`, { method: 'POST' });
      await loadResult();
      setPhase('result');
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  function onScored(out) {
    setTotals({ score: out.score, maxScore: out.maxScore });
  }

  if (phase === 'loading') return <Spinner />;

  const test = detail?.test;

  if (phase === 'intro') {
    const canStart = test && detail?.test?.window === 'live' && detail?.access?.code && !detail?.access?.revoked;
    return (
      <div className="container">
        <p className="muted"><Link to="/tests">← My tests</Link></p>
        <h1>{test?.title || `Test #${id}`}</h1>
        <div className="card stack">
          <p className="muted">
            {test?.trackTitle}
            {test?.durationMinutes ? ` · ${test.durationMinutes} minute limit once you start` : ''}
            {test?.closesAt ? ` · closes ${new Date(test.closesAt).toLocaleString()}` : ''}
          </p>
          {test?.instructions && <Markdown>{test.instructions}</Markdown>}

          {detail?.access?.revoked ? (
            <p className="badge err">Your access to this test was revoked.</p>
          ) : detail?.access?.code ? (
            <p>
              <span className="field-label">Access token</span><br />
              <code style={{ fontSize: 18 }}>{detail.access.code}</code>
            </p>
          ) : null}

          {test?.window === 'upcoming' && <p className="badge">This test has not opened yet.</p>}
          {test?.window === 'ended' && <p className="badge err">This test has closed.</p>}

          <ErrorText error={error} />
          <div>
            <button onClick={start} disabled={!canStart || busy}>
              {busy ? 'Starting…' : 'Start test'}
            </button>
          </div>
          {test?.durationMinutes && (
            <p className="muted" style={{ fontSize: 13 }}>
              The timer starts as soon as you press Start and cannot be paused.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="container">
        <p className="muted"><Link to="/tests">← My tests</Link></p>
        <h1>{test?.title} — result</h1>
        <div className="card">
          <p style={{ fontSize: 24, margin: 0 }}>
            <strong>{result?.score ?? 0}</strong>
            <span className="muted"> / {result?.maxScore ?? 0}</span>
          </p>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {result?.submitCount || 0} submission{result?.submitCount === 1 ? '' : 's'} ·
            status: {result?.status}
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Per question</h3>
          <table>
            <thead><tr><th>#</th><th>Type</th><th>Score</th><th>Cases</th><th>Attempts</th></tr></thead>
            <tbody>
              {(result?.results || []).map((r, i) => (
                <tr key={r.item_id}>
                  <td>{i + 1}</td>
                  <td>{r.type}</td>
                  <td>{r.points_awarded}/{r.points_possible}{r.needs_manual_review ? ' *' : ''}</td>
                  <td>{r.cases_total ? `${r.cases_passed}/${r.cases_total}` : '—'}</td>
                  <td className="muted">{r.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(result?.results || []).some((r) => r.needs_manual_review) && (
            <p className="muted" style={{ fontSize: 12 }}>* pending manual review</p>
          )}
        </div>

        {test?.showLeaderboard && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Leaderboard</h3>
            <Leaderboard testId={id} />
          </div>
        )}
      </div>
    );
  }

  // active
  const msLeft = endsAt ? endsAt - now : null;
  return (
    <div className="container">
      <div className="runbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>{test?.title}</h1>
          <span className="muted">Score {totals.score}/{totals.maxScore}</span>
        </div>
        <div className="runbar__right">
          {msLeft != null && (
            <span className={`runclock ${msLeft < 60000 ? 'is-low' : ''}`}>{fmtClock(msLeft)}</span>
          )}
          <button className="secondary" onClick={() => finish(false)} disabled={busy}>Finish &amp; submit</button>
        </div>
      </div>

      {test?.showLeaderboard && (
        <div className="runtabs">
          <button className={tab === 'questions' ? 'is-on' : ''} onClick={() => setTab('questions')}>Questions</button>
          <button className={tab === 'leaderboard' ? 'is-on' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        </div>
      )}

      <ErrorText error={error} />

      {tab === 'leaderboard' ? (
        <div className="card"><Leaderboard testId={id} /></div>
      ) : (
        items.map((it, i) => (
          <ItemPanel key={it.id} testId={id} item={it} index={i} onScored={onScored} />
        ))
      )}
    </div>
  );
}
