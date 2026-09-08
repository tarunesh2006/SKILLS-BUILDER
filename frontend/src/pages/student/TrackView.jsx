import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

const STATUS_BADGE = {
  completed: <span className="badge ok">Completed</span>,
  in_progress: <span className="badge warn">In progress</span>,
  not_started: <span className="badge">Not started</span>,
};

export default function TrackView() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useFetch(`/catalog/${slug}`, [slug]);
  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  async function setStatus(moduleId, status) {
    await api(`/progress/modules/${moduleId}`, { method: 'PUT', body: { status } });
    reload();
  }

  return (
    <div className="container">
      <p className="muted"><Link to="/catalog">← Catalog</Link></p>
      <h1>{data.track.title}</h1>
      <p className="muted">{data.track.description}</p>

      {data.modules.map((m) => (
        <div className="card" key={m.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{m.title}</h3>
            {STATUS_BADGE[m.progress.status] || STATUS_BADGE.not_started}
          </div>
          {m.summary && <p className="muted">{m.summary}</p>}
          <ul>
            {m.lessons.map((l) => (
              <li key={l.id}><Link to={`/lessons/${l.id}`}>{l.title}</Link></li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            {m.progress.status !== 'completed'
              ? <button onClick={() => setStatus(m.id, 'completed')}>Mark module complete</button>
              : <button className="secondary" onClick={() => setStatus(m.id, 'in_progress')}>Reopen</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
