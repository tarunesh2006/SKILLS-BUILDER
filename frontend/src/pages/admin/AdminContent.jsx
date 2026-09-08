import { useState } from 'react';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

/** Content manager: pick a track → CRUD its modules → CRUD each module's lessons. */
export default function AdminContent() {
  const tracks = useFetch('/admin/tracks');
  const [trackId, setTrackId] = useState(null);

  if (tracks.loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Content manager</h1>
      <ErrorText error={tracks.error} />
      <div className="card">
        <label>Track</label>
        <select value={trackId ?? ''} onChange={(e) => setTrackId(Number(e.target.value) || null)}>
          <option value="">Select a track…</option>
          {tracks.data?.tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.title} ({t.kind})</option>
          ))}
        </select>
      </div>
      {trackId && <Modules trackId={trackId} />}
    </div>
  );
}

function Modules({ trackId }) {
  const { data, error, loading, reload } = useFetch(`/admin/tracks/${trackId}/modules`, [trackId]);
  const [form, setForm] = useState({ title: '', summary: '', sortOrder: 0 });
  const [openId, setOpenId] = useState(null);
  const [openPanel, setOpenPanel] = useState('lessons'); // 'lessons' | 'quiz'

  async function create(e) {
    e.preventDefault();
    await api('/admin/modules', { method: 'POST', body: { trackId, ...form } });
    setForm({ title: '', summary: '', sortOrder: 0 });
    reload();
  }
  async function remove(id) {
    if (!confirm('Delete this module and its lessons?')) return;
    await api(`/admin/modules/${id}`, { method: 'DELETE' });
    reload();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <ErrorText error={error} />
      {data?.modules.map((m) => (
        <div className="card" key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{m.title}</strong>
            <span>
              <button className="secondary" onClick={() => {
                setOpenPanel('lessons');
                setOpenId(openId === m.id && openPanel === 'lessons' ? null : m.id);
              }}>Lessons</button>{' '}
              <button className="secondary" onClick={() => {
                setOpenPanel('quiz');
                setOpenId(openId === m.id && openPanel === 'quiz' ? null : m.id);
              }}>Quiz</button>{' '}
              <button className="secondary" onClick={() => remove(m.id)}>Delete</button>
            </span>
          </div>
          {m.summary && <p className="muted">{m.summary}</p>}
          {openId === m.id && openPanel === 'lessons' && <Lessons moduleId={m.id} />}
          {openId === m.id && openPanel === 'quiz' && <ModuleQuizEditor moduleId={m.id} />}
        </div>
      ))}

      <form className="card stack" onSubmit={create}>
        <h3>Add module</h3>
        <div><label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label>Summary</label>
          <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
        <div><label>Sort order</label>
          <input type="number" value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
        <button>Create module</button>
      </form>
    </>
  );
}

function Lessons({ moduleId }) {
  const { data, error, loading, reload } = useFetch(`/admin/modules/${moduleId}/lessons`, [moduleId]);
  const [form, setForm] = useState({ title: '', bodyMd: '', sortOrder: 0 });

  async function create(e) {
    e.preventDefault();
    await api('/admin/lessons', { method: 'POST', body: { moduleId, ...form } });
    setForm({ title: '', bodyMd: '', sortOrder: 0 });
    reload();
  }
  async function remove(id) {
    if (!confirm('Delete this lesson?')) return;
    await api(`/admin/lessons/${id}`, { method: 'DELETE' });
    reload();
  }

  if (loading) return <Spinner label="Loading lessons…" />;

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
      <ErrorText error={error} />
      <ul>
        {data?.lessons.map((l) => (
          <li key={l.id}>
            {l.title}{' '}
            <button className="secondary" style={{ padding: '2px 8px' }} onClick={() => remove(l.id)}>×</button>
          </li>
        ))}
      </ul>
      <form className="stack" onSubmit={create}>
        <div><label>Lesson title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label>Body (Markdown, code snippets in fenced blocks)</label>
          <textarea value={form.bodyMd} onChange={(e) => setForm({ ...form, bodyMd: e.target.value })} required /></div>
        <button>Add lesson</button>
      </form>
    </div>
  );
}

const BLANK_Q = () => ({
  promptMd: '',
  type: 'mcq',
  explanationMd: '',
  options: [
    { label: '', isCorrect: true }, { label: '', isCorrect: false },
    { label: '', isCorrect: false }, { label: '', isCorrect: false },
  ],
});

// "Check Your Understanding" quiz editor for one module.
function ModuleQuizEditor({ moduleId }) {
  const { data, error, loading, reload } = useFetch(`/admin/modules/${moduleId}/quiz`, [moduleId]);
  const [q, setQ] = useState(BLANK_Q());
  const [err, setErr] = useState(null);

  async function addQuestion(e) {
    e.preventDefault();
    setErr(null);
    try {
      const options = q.options
        .filter((o) => o.label.trim())
        .map((o, i) => ({ ...o, sortOrder: i }));
      if (options.length < 2) throw new Error('Need at least two options');
      await api(`/admin/modules/${moduleId}/quiz/questions`, {
        method: 'POST',
        body: {
          promptMd: q.promptMd, type: q.type,
          explanationMd: q.explanationMd || undefined, options,
        },
      });
      setQ(BLANK_Q());
      reload();
    } catch (e2) { setErr(e2); }
  }

  async function removeQuestion(id) {
    if (!confirm('Delete this question?')) return;
    await api(`/admin/quiz-questions/${id}`, { method: 'DELETE' });
    reload();
  }

  function setOpt(i, patch) {
    setQ((prev) => {
      const options = prev.options.map((o, j) => (j === i ? { ...o, ...patch } : o));
      // mcq: exactly one correct
      if (patch.isCorrect && prev.type === 'mcq') {
        options.forEach((o, j) => { o.isCorrect = j === i; });
      }
      return { ...prev, options };
    });
  }

  if (loading) return <Spinner label="Loading quiz…" />;
  const questions = data?.quiz?.questions || [];

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
      <ErrorText error={error} />
      <p className="muted" style={{ fontSize: 13 }}>
        Shown on the module page as a self-check. Passing (default 70%) marks the module complete.
        Separate from the code-gated exams in the Tests section.
      </p>

      {questions.length === 0 && <p className="muted">No questions yet.</p>}
      <ol>
        {questions.map((question) => (
          <li key={question.id} style={{ marginBottom: 6 }}>
            {question.prompt_md}{' '}
            <button className="secondary" style={{ padding: '2px 8px' }}
              onClick={() => removeQuestion(question.id)}>×</button>
            <ul>
              {question.options.map((o) => (
                <li key={o.id} className={o.is_correct ? '' : 'muted'}>
                  {o.is_correct ? '✓ ' : ''}{o.label}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <form className="stack" onSubmit={addQuestion}>
        <h4 style={{ margin: '4px 0' }}>Add question</h4>
        <div><label>Prompt</label>
          <input value={q.promptMd} required
            onChange={(e) => setQ({ ...q, promptMd: e.target.value })} /></div>
        <div><label>Type</label>
          <select value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
            <option value="mcq">Single answer (mcq)</option>
            <option value="multi">Multiple answers (multi)</option>
          </select>
        </div>
        <label>Options {q.type === 'mcq' ? '(pick the one correct)' : '(check all correct)'}</label>
        {q.options.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type={q.type === 'mcq' ? 'radio' : 'checkbox'} name="mq-correct"
              style={{ width: 'auto' }} checked={o.isCorrect}
              onChange={(e) => setOpt(i, { isCorrect: e.target.checked })}
            />
            <input value={o.label} placeholder={`Option ${i + 1}`}
              onChange={(e) => setOpt(i, { label: e.target.value })} />
          </div>
        ))}
        <div><label>Explanation (shown after grading)</label>
          <input value={q.explanationMd}
            onChange={(e) => setQ({ ...q, explanationMd: e.target.value })} /></div>
        <ErrorText error={err} />
        <button>Add question</button>
      </form>
    </div>
  );
}
