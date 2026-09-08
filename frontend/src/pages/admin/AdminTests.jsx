import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

export default function AdminTests() {
  const tracks = useFetch('/admin/tracks');
  const tests = useFetch('/admin/tests');
  const [form, setForm] = useState({ trackId: '', title: '', durationMinutes: '' });

  async function create(e) {
    e.preventDefault();
    const body = {
      trackId: Number(form.trackId),
      title: form.title,
      ...(form.durationMinutes ? { durationMinutes: Number(form.durationMinutes) } : {}),
    };
    await api('/admin/tests', { method: 'POST', body });
    setForm({ trackId: '', title: '', durationMinutes: '' });
    tests.reload();
  }

  if (tests.loading || tracks.loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Test creator</h1>
      <ErrorText error={tests.error} />

      {tests.data?.tests.map((t) => (
        <div className="card" key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{t.title}</strong>{' '}
            <span className="badge">{t.track_title}</span>{' '}
            {t.is_published
              ? <span className="badge ok">Published</span>
              : <span className="badge warn">Draft</span>}
            <div className="muted" style={{ fontSize: 12 }}>
              {t.total_points} pts{t.closes_at ? ` · closes ${new Date(t.closes_at).toLocaleString()}` : ''}
            </div>
          </div>
          <Link className="btn secondary" to={`/admin/tests/${t.id}`}>Edit / codes</Link>
        </div>
      ))}

      <form className="card stack" onSubmit={create}>
        <h3>New test</h3>
        <div><label>Track</label>
          <select value={form.trackId} required
            onChange={(e) => setForm({ ...form, trackId: e.target.value })}>
            <option value="">Select…</option>
            {tracks.data?.tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div><label>Title</label>
          <input value={form.title} required
            onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label>Duration (minutes, optional)</label>
          <input type="number" value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
        <button>Create test</button>
      </form>
    </div>
  );
}
