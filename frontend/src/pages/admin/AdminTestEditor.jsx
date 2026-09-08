import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

export default function AdminTestEditor() {
  const { id } = useParams();
  const tests = useFetch('/admin/tests');
  const items = useFetch(`/admin/tests/${id}/items`, [id]);
  const test = tests.data?.tests.find((t) => String(t.id) === String(id));

  if (tests.loading || items.loading) return <Spinner />;

  return (
    <div className="container">
      <p className="muted"><Link to="/admin/tests">← Tests</Link></p>
      <h1>{test?.title || `Test #${id}`}</h1>
      <span className="badge">{test?.track_title} · {test?.track_kind}</span>

      <h2>Questions</h2>
      <ErrorText error={items.error} />
      {items.data?.items.map((it, i) => (
        <div className="card" key={it.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Q{i + 1} · {it.type} · {it.points} pt</strong>
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
            <p className="muted" style={{ fontSize: 12 }}>{it.cases.length} test case(s)</p>
          )}
        </div>
      ))}

      <AddQuestion testId={id} trackKind={test?.track_kind} onAdded={items.reload} />

      <h2>Access codes</h2>
      <AccessCodes testId={id} />
    </div>
  );
}

function AddQuestion({ testId, trackKind, onAdded }) {
  const isCoding = trackKind === 'coding';
  const [type, setType] = useState(isCoding ? 'coding' : 'mcq');
  const [promptMd, setPromptMd] = useState('');
  const [points, setPoints] = useState(1);
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
      <h3>Add question</h3>
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

function AccessCodes({ testId }) {
  const students = useFetch('/admin/students');
  const codes = useFetch(`/admin/tests/${testId}/access-codes`, [testId]);
  const [selected, setSelected] = useState([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [issued, setIssued] = useState(null);
  const [err, setErr] = useState(null);

  async function generate(e) {
    e.preventDefault();
    setErr(null); setIssued(null);
    try {
      const d = await api(`/admin/tests/${testId}/access-codes`, {
        method: 'POST',
        body: { studentIds: selected, expiresAt: new Date(expiresAt).toISOString() },
      });
      setIssued(d);
      codes.reload();
    } catch (e2) { setErr(e2); }
  }

  function exportCsv() {
    if (!issued) return;
    const rows = [['roll_number', 'full_name', 'access_code', 'expires_at']]
      .concat(issued.codes.map((c) => [c.rollNumber, c.fullName, c.code, new Date(c.expiresAt).toISOString()]));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `access-codes-test-${testId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (students.loading || codes.loading) return <Spinner />;

  return (
    <div className="card stack">
      <form className="stack" onSubmit={generate}>
        <label>Students</label>
        <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
          {students.data?.students.map((s) => (
            <label key={s.id} style={{ fontWeight: 400, display: 'block' }}>
              <input type="checkbox" style={{ width: 'auto' }}
                checked={selected.includes(s.id)}
                onChange={(e) => setSelected(e.target.checked
                  ? [...selected, s.id]
                  : selected.filter((x) => x !== s.id))} />
              {' '}{s.roll_number} — {s.full_name}
            </label>
          ))}
        </div>
        <div><label>Codes expire at</label>
          <input type="datetime-local" value={expiresAt} required
            onChange={(e) => setExpiresAt(e.target.value)} /></div>
        <ErrorText error={err} />
        <button disabled={selected.length === 0}>Generate one-time codes</button>
      </form>

      {issued && (
        <div className="card" style={{ background: 'var(--accent-weak)' }}>
          <p><strong>Codes shown once</strong> — copy or export now.</p>
          <table>
            <thead><tr><th>Roll</th><th>Name</th><th>Code</th></tr></thead>
            <tbody>
              {issued.codes.map((c) => (
                <tr key={c.studentId}><td>{c.rollNumber}</td><td>{c.fullName}</td>
                  <td><code>{c.code}</code></td></tr>
              ))}
            </tbody>
          </table>
          <button className="secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      )}

      <h4>Issued codes</h4>
      <table>
        <thead><tr><th>Roll</th><th>Name</th><th>…{'   '}</th><th>Expires</th><th>Status</th><th /></tr></thead>
        <tbody>
          {codes.data?.codes.map((c) => (
            <tr key={c.student_id}>
              <td>{c.roll_number}</td><td>{c.full_name}</td>
              <td className="muted">••{c.code_last4}</td>
              <td>{new Date(c.expires_at).toLocaleString()}</td>
              <td>
                {c.revoked_at ? <span className="badge err">revoked</span>
                  : c.used_at ? <span className="badge warn">used</span>
                  : new Date(c.expires_at) < new Date() ? <span className="badge err">expired</span>
                  : <span className="badge ok">active</span>}
              </td>
              <td>
                {!c.used_at && !c.revoked_at && (
                  <button className="secondary" style={{ padding: '2px 8px' }} onClick={async () => {
                    await api(`/admin/tests/${testId}/access-codes/${c.student_id}/revoke`, { method: 'POST' });
                    codes.reload();
                  }}>Revoke</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
