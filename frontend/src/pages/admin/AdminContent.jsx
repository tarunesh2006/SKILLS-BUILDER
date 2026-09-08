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
              <button className="secondary" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
                {openId === m.id ? 'Hide lessons' : 'Lessons'}
              </button>{' '}
              <button className="secondary" onClick={() => remove(m.id)}>Delete</button>
            </span>
          </div>
          {m.summary && <p className="muted">{m.summary}</p>}
          {openId === m.id && <Lessons moduleId={m.id} />}
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
