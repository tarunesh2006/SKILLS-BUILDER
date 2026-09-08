import { useState } from 'react';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText, ProgressBar } from '../../components/common';

export default function AdminReports() {
  const tracks = useFetch('/admin/tracks');
  const students = useFetch('/admin/students');
  const [tab, setTab] = useState('progress');
  const [filters, setFilters] = useState({ studentId: '', trackId: '' });

  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v),
  ).toString();
  const progress = useFetch(`/admin/reports/progress${qs ? `?${qs}` : ''}`, [qs]);
  const scores = useFetch(`/admin/reports/scores${qs ? `?${qs}` : ''}`, [qs]);

  if (tracks.loading || students.loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Reports</h1>
      <div className="card" style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Student</label>
          <select value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}>
            <option value="">All students</option>
            {students.data?.students.map((s) => (
              <option key={s.id} value={s.id}>{s.roll_number} — {s.full_name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Track</label>
          <select value={filters.trackId}
            onChange={(e) => setFilters({ ...filters, trackId: e.target.value })}>
            <option value="">All tracks</option>
            {tracks.data?.tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button className={tab === 'progress' ? '' : 'secondary'} onClick={() => setTab('progress')}>Progress</button>
        <button className={tab === 'scores' ? '' : 'secondary'} onClick={() => setTab('scores')}>Test scores</button>
      </div>

      {tab === 'progress' && (
        <div className="card">
          <ErrorText error={progress.error} />
          <table>
            <thead><tr><th>Student</th><th>Track</th><th>Modules</th><th style={{ width: 180 }}>%</th></tr></thead>
            <tbody>
              {progress.data?.rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.roll_number} {r.full_name}</td>
                  <td>{r.track_title}</td>
                  <td>{r.modules_completed}/{r.modules_total}</td>
                  <td><ProgressBar percent={Number(r.percent_complete) || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'scores' && (
        <div className="card">
          <ErrorText error={scores.error} />
          <table>
            <thead><tr><th>Student</th><th>Test</th><th>Track</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {scores.data?.rows.map((r) => (
                <tr key={r.submission_id}>
                  <td>{r.roll_number} {r.full_name}</td>
                  <td>{r.test_title}</td>
                  <td>{r.track_title}</td>
                  <td>{r.score ?? '—'}/{r.max_score ?? '—'}</td>
                  <td>
                    {r.needs_review
                      ? <span className="badge warn">needs review</span>
                      : <span className="badge ok">{r.status}</span>}
                    {' '}
                    <button className="secondary" style={{ padding: '2px 8px' }}
                      onClick={async () => {
                        await api(`/admin/submissions/${r.submission_id}/regrade`, { method: 'POST' });
                        scores.reload();
                      }}>Regrade</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
