import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

const TABS = ['Details', 'Questions', 'Participants', 'Leaderboard', 'Statistics'];

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminTestEditor() {
  const { id } = useParams();
  const tests = useFetch('/admin/tests');
  const [tab, setTab] = useState('Details');
  const test = tests.data?.tests.find((t) => String(t.id) === String(id));

  if (tests.loading) return <Spinner />;
  if (!test) return <div className="container"><p>Test not found. <Link to="/admin/tests">Back</Link></p></div>;

  return (
    <div className="container">
      <p className="muted"><Link to="/admin/tests">← Tests</Link></p>
      <h1 style={{ marginBottom: 4 }}>{test.title}</h1>
      <p className="muted">
        {test.track_title} · {test.track_kind}
        {' · '}{test.is_published ? 'Published' : 'Draft'}
      </p>

      <div className="runtabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'is-on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Details' && <Details test={test} onSaved={tests.reload} />}
      {tab === 'Questions' && <Questions testId={id} trackKind={test.track_kind} />}
      {tab === 'Participants' && <Participants testId={id} />}
      {tab === 'Leaderboard' && <AdminLeaderboard testId={id} />}
      {tab === 'Statistics' && <Statistics testId={id} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Details */
function Details({ test, onSaved }) {
  const [f, setF] = useState({
    title: test.title,
    instructions: test.instructions || '',
    opensAt: toLocalInput(test.opens_at),
    closesAt: toLocalInput(test.closes_at),
    durationMinutes: test.duration_minutes || '',
    scoring: test.scoring || 'best',
    showLeaderboard: !!test.show_leaderboard,
    isPublished: !!test.is_published,
  });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      await api(`/admin/tests/${test.id}`, {
        method: 'PUT',
        body: {
          title: f.title,
          instructions: f.instructions,
          scoring: f.scoring,
          showLeaderboard: f.showLeaderboard,
          isPublished: f.isPublished,
          durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : undefined,
          opensAt: f.opensAt ? new Date(f.opensAt).toISOString() : undefined,
          closesAt: f.closesAt ? new Date(f.closesAt).toISOString() : undefined,
        },
      });
      setMsg('Saved.');
      onSaved();
    } catch (e2) { setErr(e2); } finally { setBusy(false); }
  }

  return (
    <form className="card stack" onSubmit={save}>
      <div><label>Title</label>
        <input value={f.title} required onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div><label>Instructions (Markdown, shown before Start)</label>
        <textarea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><label>Opens at</label>
          <input type="datetime-local" value={f.opensAt}
            onChange={(e) => setF({ ...f, opensAt: e.target.value })} /></div>
        <div><label>Closes at</label>
          <input type="datetime-local" value={f.closesAt}
            onChange={(e) => setF({ ...f, closesAt: e.target.value })} /></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><label>Time limit (minutes)</label>
          <input type="number" min="1" value={f.durationMinutes}
            onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} /></div>
        <div><label>Scoring</label>
          <select value={f.scoring} onChange={(e) => setF({ ...f, scoring: e.target.value })}>
            <option value="best">Keep best submission</option>
            <option value="last">Keep last submission</option>
          </select>
        </div>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={f.showLeaderboard}
          onChange={(e) => setF({ ...f, showLeaderboard: e.target.checked })} />
        Show a live leaderboard to participants
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={f.isPublished}
          onChange={(e) => setF({ ...f, isPublished: e.target.checked })} />
        Published (visible to assigned students)
      </label>

      <ErrorText error={err} />
      {msg && <p className="badge ok">{msg}</p>}
      <div><button disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button></div>
    </form>
  );
}

/* ---------------------------------------------------------------- Questions */
function Questions({ testId, trackKind }) {
  const items = useFetch(`/admin/tests/${testId}/items`, [testId]);
  if (items.loading) return <Spinner />;

  return (
    <>
      <ErrorText error={items.error} />
      {(items.data?.items || []).length === 0 && <p className="muted">No questions yet.</p>}
      {items.data?.items.map((it, i) => (
        <div className="card" key={it.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Q{i + 1} · {it.type} · {it.points} pt{it.points === 1 ? '' : 's'}</strong>
            <button className="secondary" onClick={async () => {
              if (!confirm('Delete question?')) return;
              await api(`/admin/items/${it.id}`, { method: 'DELETE' });
              items.reload();
            }}>Delete</button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{it.prompt_md}</pre>
          {it.options?.length > 0 && (
            <ul>{it.options.map((o) => (
              <li key={o.id}>{o.is_correct ? '✓ ' : ''}{o.label}</li>
            ))}</ul>
          )}
          {it.cases?.length > 0 && (
            <p className="muted" style={{ fontSize: 12 }}>
              {it.cases.length} test case(s) · {it.cases.filter((c) => c.is_sample).length} visible sample(s)
            </p>
          )}
        </div>
      ))}
      <AddQuestion testId={testId} trackKind={trackKind} onAdded={items.reload} />
    </>
  );
}

function AddQuestion({ testId, trackKind, onAdded }) {
  const isCoding = trackKind === 'coding';
  const [type, setType] = useState(isCoding ? 'coding' : 'mcq');
  const [promptMd, setPromptMd] = useState('');
  const [points, setPoints] = useState(10);
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [options, setOptions] = useState([{ label: '', isCorrect: true }, { label: '', isCorrect: false }]);
  const [cases, setCases] = useState([{ stdin: '', expectedStdout: '', isSample: true }]);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    try {
      const body = { type, promptMd, points: Number(points) };
      if (type === 'mcq') body.options = options.filter((o) => o.label.trim());
      if (type === 'coding') body.cases = cases.filter((c) => c.expectedStdout !== '' || c.stdin !== '');
      if (type === 'short_answer' || type === 'query') {
        body.expectedAnswer = expectedAnswer;
        body.gradingMode = 'auto_exact';
      }
      await api(`/admin/tests/${testId}/items`, { method: 'POST', body });
      setPromptMd(''); setExpectedAnswer('');
      setOptions([{ label: '', isCorrect: true }, { label: '', isCorrect: false }]);
      setCases([{ stdin: '', expectedStdout: '', isSample: true }]);
      onAdded();
    } catch (e2) { setErr(e2); }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Add question</h3>
      <div><label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {isCoding
            ? <option value="coding">coding (auto-graded)</option>
            : <>
                <option value="mcq">mcq</option>
                <option value="short_answer">short_answer</option>
                <option value="query">query</option>
              </>}
        </select>
      </div>
      <div><label>Prompt (Markdown)</label>
        <textarea value={promptMd} required onChange={(e) => setPromptMd(e.target.value)} /></div>
      <div><label>Points</label>
        <input type="number" min="1" value={points} onChange={(e) => setPoints(e.target.value)} /></div>

      {type === 'mcq' && (
        <div className="stack">
          <label>Options (check the correct one)</label>
          {options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" name="correct" style={{ width: 'auto' }}
                checked={o.isCorrect}
                onChange={() => setOptions(options.map((x, j) => ({ ...x, isCorrect: j === i })))} />
              <input value={o.label}
                onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            </div>
          ))}
          <button type="button" className="secondary"
            onClick={() => setOptions([...options, { label: '', isCorrect: false }])}>+ option</button>
        </div>
      )}

      {(type === 'short_answer' || type === 'query') && (
        <div><label>Expected answer (exact match)</label>
          <textarea value={expectedAnswer} onChange={(e) => setExpectedAnswer(e.target.value)} /></div>
      )}

      {type === 'coding' && (
        <div className="stack">
          <label>Test cases (stdin → expected stdout)</label>
          {cases.map((c, i) => (
            <div key={i} className="stack" style={{ border: '1px solid var(--border)', padding: 8, borderRadius: 8 }}>
              <textarea placeholder="stdin" value={c.stdin}
                onChange={(e) => setCases(cases.map((x, j) => j === i ? { ...x, stdin: e.target.value } : x))} />
              <textarea placeholder="expected stdout" value={c.expectedStdout}
                onChange={(e) => setCases(cases.map((x, j) => j === i ? { ...x, expectedStdout: e.target.value } : x))} />
              <label style={{ fontWeight: 400 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={c.isSample}
                  onChange={(e) => setCases(cases.map((x, j) => j === i ? { ...x, isSample: e.target.checked } : x))} />
                {' '}visible sample case
              </label>
            </div>
          ))}
          <button type="button" className="secondary"
            onClick={() => setCases([...cases, { stdin: '', expectedStdout: '', isSample: false }])}>+ case</button>
        </div>
      )}

      <ErrorText error={err} />
      <button>Add question</button>
    </form>
  );
}

/* ------------------------------------------------------------- Participants */
function Participants({ testId }) {
  const students = useFetch('/admin/students');
  const parts = useFetch(`/admin/tests/${testId}/participants`, [testId]);
  const [selected, setSelected] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const assignedIds = new Set((parts.data?.participants || []).map((p) => p.studentId));

  async function assign(payload) {
    setBusy(true); setErr(null);
    try {
      await api(`/admin/tests/${testId}/participants`, { method: 'POST', body: payload });
      setSelected([]);
      parts.reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  }

  async function revoke(studentId) {
    if (!confirm('Revoke this student’s access token?')) return;
    await api(`/admin/tests/${testId}/participants/${studentId}/revoke`, { method: 'POST' });
    parts.reload();
  }

  if (students.loading || parts.loading) return <Spinner />;

  const unassigned = (students.data?.students || []).filter((s) => !assignedIds.has(s.id));

  return (
    <>
      <div className="card stack">
        <h3 style={{ marginTop: 0 }}>Assign participants</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Each assigned student gets a one-time access token delivered inside the app —
          it shows on their <strong>My tests</strong> page with a one-click Start.
        </p>

        {unassigned.length === 0 ? (
          <p className="muted">Every student is already assigned.</p>
        ) : (
          <>
            <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
              {unassigned.map((s) => (
                <label key={s.id} style={{ fontWeight: 400, display: 'block' }}>
                  <input type="checkbox" style={{ width: 'auto' }}
                    checked={selected.includes(s.id)}
                    onChange={(e) => setSelected(e.target.checked
                      ? [...selected, s.id]
                      : selected.filter((x) => x !== s.id))} />
                  {' '}{s.roll_number || '(no roll)'} — {s.full_name}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={selected.length === 0 || busy}
                onClick={() => assign({ studentIds: selected })}>
                Assign {selected.length || ''} selected
              </button>
              <button className="secondary" disabled={busy}
                onClick={() => assign({ assignAll: true })}>
                Assign all active students
              </button>
            </div>
          </>
        )}
        <ErrorText error={err} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Assigned ({parts.data?.participants.length || 0})</h3>
        <table>
          <thead>
            <tr><th>Roll</th><th>Name</th><th>Token</th><th>Status</th><th>Score</th><th>Subs</th><th /></tr>
          </thead>
          <tbody>
            {(parts.data?.participants || []).map((p) => (
              <tr key={p.studentId}>
                <td>{p.rollNumber || '—'}</td>
                <td>{p.name}</td>
                <td>
                  {p.codeRevoked ? <span className="badge err">revoked</span>
                    : <code>{p.code}</code>}
                </td>
                <td>
                  {p.status === 'not_started' && <span className="badge">not started</span>}
                  {p.status === 'in_progress' && <span className="badge warn">in progress</span>}
                  {(p.status === 'submitted' || p.status === 'graded') && <span className="badge ok">{p.status}</span>}
                </td>
                <td>{p.score != null ? `${p.score}/${p.maxScore ?? ''}` : '—'}</td>
                <td className="muted">{p.submitCount ?? 0}</td>
                <td>
                  {!p.codeRevoked && p.status === 'not_started' && (
                    <button className="secondary" style={{ padding: '2px 8px' }}
                      onClick={() => revoke(p.studentId)}>Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* -------------------------------------------------------------- Leaderboard */
function AdminLeaderboard({ testId }) {
  const lb = useFetch(`/admin/tests/${testId}/leaderboard`, [testId]);
  if (lb.loading) return <Spinner />;
  const rows = lb.data?.leaderboard || [];
  if (rows.length === 0) return <p className="muted">No submissions yet.</p>;

  return (
    <div className="card">
      <table>
        <thead><tr><th>#</th><th>Roll</th><th>Name</th><th>Score</th><th>Penalty</th><th>Subs</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td>{r.rank}</td>
              <td>{r.rollNumber || '—'}</td>
              <td>{r.name}</td>
              <td>{r.score}/{r.maxScore}</td>
              <td className="muted">{r.penaltySeconds}s</td>
              <td className="muted">{r.submissions}</td>
              <td className="muted">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------------------------------------- Statistics */
function Statistics({ testId }) {
  const st = useFetch(`/admin/tests/${testId}/statistics`, [testId]);
  if (st.loading) return <Spinner />;
  const s = st.data?.stats || {};
  const cards = [
    ['Assigned', s.assigned], ['Started', s.started], ['Finished', s.finished],
    ['Students who submitted', s.submitted_code], ['Total submissions', s.total_submissions],
    ['Average score', s.avg_score ?? '—'], ['Top score', s.top_score ?? '—'],
  ];
  return (
    <div className="grid">
      {cards.map(([label, val]) => (
        <div className="card" key={label} style={{ marginBottom: 0 }}>
          <div className="field-label">{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{val ?? 0}</div>
        </div>
      ))}
    </div>
  );
}
