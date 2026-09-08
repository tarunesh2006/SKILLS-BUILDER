import { useFetch } from '../useApi';
import { Spinner, ErrorText, ProgressBar } from '../../components/common';

export default function ProgressView() {
  const { data, error, loading } = useFetch('/progress');
  if (loading) return <Spinner />;

  return (
    <div className="container">
      <h1>My progress</h1>
      <ErrorText error={error} />
      <div className="card">
        <table>
          <thead>
            <tr><th>Track</th><th>Modules</th><th style={{ width: 200 }}>Complete</th></tr>
          </thead>
          <tbody>
            {data?.tracks.map((t) => (
              <tr key={t.track_id}>
                <td>{t.track_title}</td>
                <td>{t.modules_completed} / {t.modules_total}</td>
                <td>
                  <ProgressBar percent={Number(t.percent_complete) || 0} />
                  <span className="muted" style={{ fontSize: 12 }}>{t.percent_complete ?? 0}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
