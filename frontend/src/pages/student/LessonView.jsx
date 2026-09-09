import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText, Markdown } from '../../components/common';
import './LessonView.css';

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useFetch(`/catalog/lessons/${id}`, [id]);
  const [viewed, setViewed] = useState(false);
  const marked = useRef(null);

  // Record the view once per lesson id (drives auto-completion).
  useEffect(() => {
    if (!data || marked.current === id) return;
    marked.current = id;
    setViewed(false);
    api(`/catalog/lessons/${id}/view`, { method: 'POST' })
      .then(() => setViewed(true))
      .catch(() => {});
  }, [data, id]);

  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  const { lesson, nav } = data;
  const backTo = `/tracks/${lesson.track_slug}?m=${lesson.module_id}`;

  // A lesson body conventionally opens with its own `# Title`; drop it if it
  // just repeats the lesson title.
  const bodyMd = String(lesson.body_md || '').replace(
    /^\s*#\s+(.+?)\s*\n+/,
    (m, h) => (h.trim().toLowerCase() === lesson.title.trim().toLowerCase() ? '' : m),
  );

  return (
    <div className="lv">
      <aside className="lv-rail">
        <Link to={backTo} className="lv-rail__back">← {lesson.module_title.replace(/^Module\s+\d+:\s*/i, '')}</Link>
        <h4>LESSONS</h4>
        <ol>
          {nav.lessons.map((l) => (
            <li key={l.id}>
              <Link to={`/lessons/${l.id}`} className={String(l.id) === String(id) ? 'active' : ''}>
                <span className="mk">{l.viewed || (String(l.id) === String(id) && viewed) ? '✓' : ''}</span>
                {l.title}
              </Link>
            </li>
          ))}
        </ol>
      </aside>

      <article className="lv-article">
        <span className="lv-eyebrow">{lesson.track_title} · Lesson {nav.index + 1} of {nav.total}</span>
        <h1>{lesson.title}</h1>
        <Markdown>{bodyMd}</Markdown>

        <div className="lv-foot">
          {nav.prevId
            ? <Link className="lv-prev" to={`/lessons/${nav.prevId}`}>← Previous lesson</Link>
            : <span />}
          <span className="lv-done">{viewed ? '✓ Marked as read' : ''}</span>
          {nav.nextId
            ? <Link className="lv-next" to={`/lessons/${nav.nextId}`}>Next lesson →</Link>
            : <button className="lv-next" onClick={() => navigate(backTo)}>Back to module →</button>}
        </div>
      </article>
    </div>
  );
}
