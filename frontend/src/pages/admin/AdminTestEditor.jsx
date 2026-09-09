import { useState, useRef } from 'react';
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
  const [seed, setSeed] = useState(null);
  const [seedKey, setSeedKey] = useState(0);
  const formRef = useRef(null);

  function applyDraft(draft) {
    setSeed(draft);
    setSeedKey((k) => k + 1);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  if (items.loading) return <Spinner />;

  return (
    <>
      <ImportPanel testId={testId} trackKind={trackKind}
        onDraft={applyDraft} onBulkDone={items.reload} />

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
      <div ref={formRef}>
        <AddQuestion key={seedKey} seed={seed} testId={testId} trackKind={trackKind} onAdded={items.reload} />
      </div>
    </>
  );
}

/* --------------------------------------------------- import without typing */
function ImportPanel({ testId, trackKind, onDraft, onBulkDone }) {
  const [url, setUrl] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlErr, setUrlErr] = useState(null);
  const [urlNote, setUrlNote] = useState(null);

  const [format, setFormat] = useState('json');
  const [content, setContent] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkErr, setBulkErr] = useState(null);
  const [bulkMsg, setBulkMsg] = useState(null);

  async function fetchUrl(e) {
    e.preventDefault();
    setUrlBusy(true); setUrlErr(null); setUrlNote(null);
    try {
      const d = await api(`/admin/tests/${testId}/import/url`, {
        method: 'POST',
        body: { url: url.trim(), type: trackKind === 'coding' ? 'coding' : undefined },
      });
      onDraft(d.draft);
      setUrlNote(`Loaded “${d.detected.title || 'question'}” — ${d.detected.caseCount} sample case(s) found. ${d.note}`);
    } catch (e2) { setUrlErr(e2); } finally { setUrlBusy(false); }
  }

  async function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setContent(await file.text());
    if (/\.json$/i.test(file.name)) setFormat('json');
    else if (/\.csv$/i.test(file.name)) setFormat('csv');
    else if (/\.(md|markdown|txt)$/i.test(file.name)) setFormat('markdown');
  }

  async function importBulk(e) {
    e.preventDefault();
    setBulkBusy(true); setBulkErr(null); setBulkMsg(null);
    try {
      const d = await api(`/admin/tests/${testId}/import/bulk`, {
        method: 'POST',
        body: { format, content, fallbackType: trackKind === 'coding' ? 'coding' : 'mcq' },
      });
      setBulkMsg(`Imported ${d.created} question${d.created === 1 ? '' : 's'}.`);
      setContent('');
      onBulkDone();
    } catch (e2) { setBulkErr(e2); } finally { setBulkBusy(false); }
  }

  const placeholder = {
    json: '[\n  { "type": "coding", "prompt": "Read n, print n*n", "points": 30,\n    "cases": [ { "input": "3", "output": "9", "sample": true }, { "input": "8", "output": "64" } ] },\n  { "type": "mcq", "prompt": "Which is a keyword?", "points": 5,\n    "options": [ { "label": "for", "isCorrect": true }, { "label": "banana" } ] }\n]',
    csv: 'type,prompt,points,optionA,optionB,optionC,correct\nmcq,"What is 3*3?",5,6,9,12,B\nmcq,"Pick a loop",5,while,elephant,banana,A',
    markdown: '@type=coding points=20\nRead n and print n + n.\n```in\n4\n```\n```out\n8\n```\n---\n@type=mcq\nWhich keyword starts a loop?\n- [ ] if\n- [x] while',
  }[format];

  return (
    <div className="card stack">
      <h3 style={{ marginTop: 0 }}>Import questions <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>— skip the typing</span></h3>

      <form className="stack" onSubmit={fetchUrl}>
        <label>From a web page (URL)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="url" placeholder="https://…/problem-page" value={url}
            onChange={(ev) => setUrl(ev.target.value)} required />
          <button disabled={urlBusy || !url.trim()} style={{ flex: '0 0 auto' }}>
            {urlBusy ? 'Fetching…' : 'Fetch'}
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          The page text and any visible sample cases are pulled into the form below for you to
          review. Only import content you have the right to use.
        </p>
        <ErrorText error={urlErr} />
        {urlNote && <p className="badge ok" style={{ whiteSpace: 'normal' }}>{urlNote}</p>}
      </form>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Bulk import (many at once)</summary>
        <form className="stack" onSubmit={importBulk} style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={format} onChange={(ev) => setFormat(ev.target.value)} style={{ width: 'auto' }}>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="markdown">Markdown</option>
            </select>
            <input type="file" accept=".json,.csv,.md,.markdown,.txt" onChange={pickFile}
              style={{ width: 'auto' }} />
          </div>
          <textarea value={content} placeholder={placeholder} spellCheck={false}
            style={{ minHeight: 160 }} onChange={(ev) => setContent(ev.target.value)} />
          <ErrorText error={bulkErr} />
          {bulkMsg && <p className="badge ok">{bulkMsg}</p>}
          <div><button disabled={bulkBusy || !content.trim()}>{bulkBusy ? 'Importing…' : 'Import all'}</button></div>
        </form>
      </details>
    </div>
  );
}

function AddQuestion({ testId, trackKind, onAdded, seed }) {
  const isCoding = trackKind === 'coding';
  const [type, setType] = useState(seed?.type ?? (isCoding ? 'coding' : 'mcq'));
  const [promptMd, setPromptMd] = useState(seed?.promptMd ?? '');
  const [points, setPoints] = useState(seed?.points ?? 10);
  const [expectedAnswer, setExpectedAnswer] = useState(seed?.expectedAnswer ?? '');
  const [options, setOptions] = useState(
    seed?.options?.length
      ? seed.options.map((o) => ({ label: o.label, isCorrect: !!o.isCorrect }))
      : [{ label: '', isCorrect: true }, { label: '', isCorrect: false }],
  );
  const [cases, setCases] = useState(
    seed?.cases?.length
      ? seed.cases.map((c) => ({ stdin: c.stdin ?? '', expectedStdout: c.expectedStdout ?? '', isSample: c.isSample ?? true }))
      : [{ stdin: '', expectedStdout: '', isSample: true }],
  );
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
      <h3 style={{ marginTop: 0 }}>{seed ? 'Review imported question' : 'Add question'}</h3>
      {seed && <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Pre-filled from your import — edit anything, add hidden test cases, then save.
      </p>}
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
