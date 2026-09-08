import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText, Markdown } from '../../components/common';

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useFetch(`/catalog/lessons/${id}`, [id]);
  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  // Lesson bodies conventionally open with their own `# Title` heading; drop a
  // leading H1 that just repeats the lesson title so it isn't shown twice.
  const body = String(data.lesson.body_md || '').replace(
    /^\s*#\s+(.+?)\s*\n+/,
    (m, h) => (h.trim().toLowerCase() === data.lesson.title.trim().toLowerCase() ? '' : m),
  );

  return (
    <div className="container">
      <p className="muted"><a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>← Back</a></p>
      <div className="card">
        <h1>{data.lesson.title}</h1>
        <Markdown>{body}</Markdown>
      </div>
    </div>
  );
}
