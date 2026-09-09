import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText } from '../../components/common';

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function fmtLeft(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function windowBadge(t) {
  if (t.window === 'upcoming') return <span className="badge">Upcoming</span>;
  if (t.window === 'ended') return <span className="badge err">Closed</span>;
  return <span className="badge ok">Live now</span>;
}

function statusLine(t) {
  if (t.submissionStatus === 'submitted' || t.submissionStatus === 'graded') {
    return <span className="badge ok">Submitted{t.score != null ? ` · ${t.score}/${t.maxScore}` : ''}</span>;
  }
  if (t.started) return <span className="badge warn">In progress</span>;
  return null;
}

export default function TestList() {
  const { data, error, loading } = useFetch('/tests');
  const navigate = useNavigate();
  const now = useNow();

  if (loading) return <Spinner />;
  const tests = data?.tests || [];

  return (
    <div className="container">
      <h1>My tests</h1>
      <ErrorText error={error} />
      {tests.length === 0 && (
        <p className="muted">No tests have been assigned to you yet.</p>
      )}

      <div className="stack">
        {tests.map((t) => {
          const opens = t.opensAt ? new Date(t.opensAt).getTime() : null;
          const closes = t.closesAt ? new Date(t.closesAt).getTime() : null;
          const done = t.submissionStatus === 'submitted' || t.submissionStatus === 'graded';
          const canEnter = !done && t.window === 'live' && (t.accessCode || t.started);

          return (
            <div className="card testcard" key={t.id}>
              <div className="testcard__main">
                <div className="testcard__head">
                  <h3>{t.title}</h3>
                  {windowBadge(t)}
                  {statusLine(t)}
                </div>
                <p className="muted testcard__meta">
                  {t.trackTitle}
                  {' · '}{t.itemCount} question{t.itemCount === 1 ? '' : 's'}
                  {t.totalPoints ? ` · ${t.totalPoints} pts` : ''}
                  {t.durationMinutes ? ` · ${t.durationMinutes} min limit` : ''}
                </p>

                {t.window === 'upcoming' && opens && (
                  <p className="testcard__count">Opens in <strong>{fmtLeft(opens - now)}</strong>
                    <span className="muted"> · {new Date(opens).toLocaleString()}</span></p>
                )}
                {t.window === 'live' && closes && (
                  <p className="testcard__count">Closes in <strong>{fmtLeft(closes - now)}</strong></p>
                )}
                {t.window === 'ended' && closes && (
                  <p className="muted">Closed {new Date(closes).toLocaleString()}</p>
                )}
              </div>

              <div className="testcard__side">
                {t.codeRevoked ? (
                  <span className="badge err">Access revoked</span>
                ) : t.accessCode && !done ? (
                  <div className="testcard__token">
                    <span className="field-label">Your access token</span>
                    <code>{t.accessCode}</code>
                    <span className="muted testcard__tokenhint">
                      Delivered to you — no need to type it, just press Start.
                    </span>
                  </div>
                ) : null}

                {done && (
                  <button className="btn secondary" onClick={() => navigate(`/tests/${t.id}`)}>
                    View result
                  </button>
                )}
                {!done && (
                  <button
                    className="btn"
                    disabled={!canEnter}
                    onClick={() => navigate(`/tests/${t.id}`)}
                  >
                    {t.started ? 'Resume test' : t.window === 'upcoming' ? 'Not open yet' : 'Start test'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
