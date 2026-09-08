import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../useApi';
import { Spinner, ErrorText } from '../../components/common';
import './TrackView.css';

// Presentation copy per track (headline + blurb for the path intro).
const TAGLINES = {
  python: ['Learn Python, one concept at a time.',
    'Start with readable syntax and build confidence through practical automation projects.'],
  c: ['Learn C from the machine up.',
    'Understand memory, pointers, and how a program actually runs on the hardware.'],
  cpp: ['Learn C++ the modern way.',
    'From the core language to the STL, RAII, and clean object-oriented design.'],
  java: ['Learn Java, built to scale.',
    'Master OOP, collections, exceptions, and the JVM through hands-on practice.'],
  mysql: ['Think in tables and queries.',
    'Model relational data and pull real answers out of it with SQL.'],
  mongodb: ['Learn the document model.',
    'CRUD, the aggregation pipeline, and indexing for real workloads.'],
  react: ['Build interfaces that react.',
    'Components, props, state, and hooks — one render at a time.'],
  networking: ['See how the internet actually works.',
    'The OSI and TCP/IP models, addressing, routing, and switching.'],
};

const shortTitle = (t) => t.replace(/^Module\s+\d+:\s*/i, '');

const Check = ({ className = 'tv-check' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function ModulePane({ track, slug, module: m, index, total, onNav }) {
  const done = m.progress.status === 'completed';
  const lessonsDone = m.lessonsTotal > 0 && m.lessonsViewed >= m.lessonsTotal;
  const quizDone = !m.quiz || m.quizPassed;

  return (
    <div>
      <div className="tv-headrow">
        <div>
          <span className="tv-eyebrow">📘 {track.title} · Module {index + 1}</span>
          <h1>{shortTitle(m.title)}</h1>
          {m.summary && <p className="tv-lede">{m.summary}</p>}
        </div>
        <span className={`tv-status ${done ? 'is-done' : ''}`}>
          {done ? 'Completed ✓' : 'In progress'}
        </span>
      </div>

      {!done && (
        <p className="tv-gate">
          This module completes automatically once you&apos;ve opened every lesson
          {m.quiz ? ' and passed the quiz.' : '.'}
        </p>
      )}

      {m.lessons.length > 0 && (
        <ul className="tv-lessons">
          {m.lessons.map((l) => (
            <li key={l.id}>
              <Link to={`/lessons/${l.id}`} className={l.viewed ? 'is-viewed' : ''}>
                <span className="tv-lesson-mark">{l.viewed ? <Check className="tv-check-sm" /> : ''}</span>
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="tv-reqs">
        <span className={lessonsDone ? 'is-met' : ''}>
          {lessonsDone ? '✓' : '○'} Lessons {m.lessonsViewed}/{m.lessonsTotal}
        </span>
        {m.quiz && (
          <span className={quizDone ? 'is-met' : ''}>
            {quizDone ? '✓' : '○'} Quiz {m.quizPassed
              ? `passed (${m.quiz.attempt.percent}%)`
              : m.quiz.attempt
                ? `last ${m.quiz.attempt.percent}% — need ${m.quiz.passPercent}%`
                : `not attempted — need ${m.quiz.passPercent}%`}
          </span>
        )}
      </div>

      {m.quiz && m.quiz.questionCount > 0 && (
        <div className="tv-actions">
          <Link className="tv-btn" to={`/tracks/${slug}/modules/${m.id}/quiz`}>
            {m.quiz.attempt ? 'Retake' : 'Take'} the module quiz
            <span className="tv-hint"> · {m.quiz.questionCount} questions</span>
          </Link>
        </div>
      )}

      <div className="tv-nav">
        <button disabled={index === 0} onClick={() => onNav(index - 1)}>← Previous module</button>
        <button disabled={index === total - 1} onClick={() => onNav(index + 1)}>Next module →</button>
      </div>
    </div>
  );
}

function TrackIntro({ track, slug, modules, onOpen }) {
  const [headline, blurb] = TAGLINES[slug] || [track.title, track.description];
  const doneCount = modules.filter((m) => m.progress.status === 'completed').length;
  const pct = modules.length ? Math.round((100 * doneCount) / modules.length) : 0;
  return (
    <div>
      <div className="tv-headrow">
        <div>
          <span className="tv-eyebrow">📘 {track.title} learning path</span>
          <h1>{headline}</h1>
          <p className="tv-lede">{blurb}</p>
        </div>
        <button className="tv-open" onClick={onOpen}>
          {doneCount > 0 && doneCount < modules.length ? 'Resume course' : 'Open course'} →
        </button>
      </div>
      <div className="tv-progressline">
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <span>{doneCount} / {modules.length} modules complete</span>
      </div>
    </div>
  );
}

export default function TrackView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, error, loading } = useFetch(`/catalog/${slug}`, [slug]);

  if (loading) return <Spinner />;
  if (error) return <div className="container"><ErrorText error={error} /></div>;

  const modules = data.modules;
  const selectedId = params.get('m');
  const selectedIndex = modules.findIndex((m) => String(m.id) === selectedId);
  const selected = selectedIndex >= 0 ? modules[selectedIndex] : null;

  const select = (moduleId) => setParams(moduleId ? { m: String(moduleId) } : {});

  return (
    <div className="tv">
      <div className="tv__inner">
        <p className="tv-crumb">
          <Link to="/catalog">← All tracks</Link>
          {selected && <> &nbsp;/&nbsp; <a href="#top" onClick={(e) => { e.preventDefault(); select(null); }}>{data.track.title}</a></>}
        </p>

        <div className="tv-panel">
          <aside className="tv-modules">
            <div className="tv-modules__head">
              <b>MODULES</b>
              <span className="tv-units">{modules.length} units</span>
            </div>
            <ol>
              {modules.map((m, i) => {
                const done = m.progress.status === 'completed';
                const active = selected?.id === m.id;
                return (
                  <li key={m.id}>
                    <button className={active ? 'active' : ''} onClick={() => select(m.id)}>
                      <span className={`tv-num${done ? ' tv-num--done' : ''}`}>
                        {done ? '✓' : String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="tv-mod-title">{shortTitle(m.title)}</span>
                      {m.progress.status === 'in_progress' && !active && <span className="tv-dot" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="tv-main">
            {selected ? (
              <ModulePane
                track={data.track}
                slug={slug}
                module={selected}
                index={selectedIndex}
                total={modules.length}
                onNav={(i) => select(modules[i].id)}
              />
            ) : (
              <TrackIntro
                track={data.track}
                slug={slug}
                modules={modules}
                onOpen={() => {
                  const next = modules.find((m) => m.progress.status !== 'completed') || modules[0];
                  if (next) select(next.id);
                  else navigate(`/lessons/${modules[0].lessons[0]?.id}`);
                }}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
