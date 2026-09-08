import { Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText } from '../../components/common';

function codeState(t) {
  if (t.revoked_at) return <span className="badge err">Code revoked</span>;
  if (t.submission_status === 'graded') return <span className="badge ok">Score {t.score}/{t.max_score}</span>;
  if (t.submission_status) return <span className="badge warn">Submitted</span>;
  if (t.code_used_at) return <span className="badge warn">Unlocked</span>;
  if (new Date(t.code_expires_at) < new Date()) return <span className="badge err">Code expired</span>;
  return <span className="badge">Locked</span>;
}

export default function TestList() {
  const { data, error, loading } = useFetch('/tests');
  if (loading) return <Spinner />;

  return (
    <div className="container">
      <h1>Tests</h1>
      <ErrorText error={error} />
      {(!data?.tests || data.tests.length === 0) && (
        <p className="muted">No tests have been assigned to you yet.</p>
      )}
      {data?.tests.map((t) => (
        <div className="card" key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>{t.title}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {t.track_title}
              {t.duration_minutes ? ` · ${t.duration_minutes} min` : ''}
              {t.closes_at ? ` · closes ${new Date(t.closes_at).toLocaleString()}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>{codeState(t)}</div>
            {!t.submission_status && (
              <Link className="btn" to={`/tests/${t.id}`} style={{ marginTop: 8, display: 'inline-block' }}>
                {t.code_used_at ? 'Resume' : 'Enter access code'}
              </Link>
            )}
            {t.submission_status && (
              <Link to={`/tests/${t.id}`} style={{ marginTop: 8, display: 'inline-block' }}>View result</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
