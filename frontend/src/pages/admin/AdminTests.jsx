import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

const empty = {
  trackId: '', title: '', durationMinutes: '',
  opensAt: '', closesAt: '', scoring: 'best', showLeaderboard: true,
};

export default function AdminTests() {
  const tracks = useFetch('/admin/tracks');
  const tests = useFetch('/admin/tests');
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState(null);

  async function create(e) {
    e.preventDefault();
    setErr(null);
    try {
      const body = {
        trackId: Number(form.trackId),
        title: form.title,
        scoring: form.scoring,
        showLeaderboard: form.showLeaderboard,
        ...(form.durationMinutes ? { durationMinutes: Number(form.durationMinutes) } : {}),
        ...(form.opensAt ? { opensAt: new Date(form.opensAt).toISOString() } : {}),
        ...(form.closesAt ? { closesAt: new Date(form.closesAt).toISOString() } : {}),
      };
      await api('/admin/tests', { method: 'POST', body });
      setForm(empty);
      tests.reload();
    } catch (e2) { setErr(e2); }
  }

  if (tests.loading || tracks.loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Contests &amp; tests</h1>
      <ErrorText error={tests.error} />

      {tests.data?.tests.map((t) => (
        <div className="card" key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{t.title}</strong>{' '}
            <span className="badge">{t.track_title}</span>{' '}
            {t.is_published
              ? <span className="badge ok">Published</span>
              : <span className="badge warn">Draft</span>}
            <div className="muted" style={{ fontSize: 12 }}>
              {t.total_points} pts · scoring: {t.scoring}
              {t.opens_at ? ` · opens ${new Date(t.opens_at).toLocaleString()}` : ''}
              {t.closes_at ? ` · closes ${new Date(t.closes_at).toLocaleString()}` : ''}
            </div>
          </div>
          <Link className="btn secondary" to={`/admin/tests/${t.id}`}>Open</Link>
        </div>
      ))}

      <form className="card stack" onSubmit={create}>
        <h3 style={{ marginTop: 0 }}>New contest / test</h3>
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

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label>Opens at</label>
            <input type="datetime-local" value={form.opensAt}
              onChange={(e) => setForm({ ...form, opensAt: e.target.value })} /></div>
          <div><label>Closes at</label>
            <input type="datetime-local" value={form.closesAt}
              onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label>Time limit (minutes, optional)</label>
            <input type="number" min="1" value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
          <div><label>Scoring</label>
            <select value={form.scoring} onChange={(e) => setForm({ ...form, scoring: e.target.value })}>
              <option value="best">Keep best submission</option>
              <option value="last">Keep last submission</option>
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={form.showLeaderboard}
            onChange={(e) => setForm({ ...form, showLeaderboard: e.target.checked })} />
          Show a live leaderboard to participants
        </label>

        <ErrorText error={err} />
        <button>Create — then add questions &amp; participants</button>
      </form>
    </div>
  );
}
