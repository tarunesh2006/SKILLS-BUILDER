import { Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText } from '../../components/common';

export default function Catalog() {
  const { data, error, loading } = useFetch('/catalog');
  if (loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Course catalog</h1>
      <ErrorText error={error} />
      <div className="grid">
        {data?.tracks.map((t) => (
          <Link key={t.id} to={`/tracks/${t.slug}`} className="card" style={{ display: 'block' }}>
            <h3 style={{ margin: '0 0 6px' }}>{t.title}</h3>
            <span className="badge">{t.kind === 'coding' ? 'Coding' : 'Concepts'}</span>
            <p className="muted" style={{ marginBottom: 0 }}>{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
