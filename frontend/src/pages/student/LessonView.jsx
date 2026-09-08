import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText, Markdown } from '../../components/common';

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useFetch(`/catalog/lessons/${id}`, [id]);
  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  return (
    <div className="container">
      <p className="muted"><a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>← Back</a></p>
      <div className="card">
        <h1>{data.lesson.title}</h1>
        <Markdown>{data.lesson.body_md}</Markdown>
      </div>
    </div>
  );
}
