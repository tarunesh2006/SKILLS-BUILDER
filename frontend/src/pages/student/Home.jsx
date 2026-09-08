import { Link } from 'react-router-dom';
import { useFetch } from '../useApi';
import { useAuth } from '../../context/AuthContext';
import { Spinner, ErrorText } from '../../components/common';
import './Home.css';

function CodeCard({ firstName }) {
  const lines = [
    <><span className="kw">def</span> <span className="fn">build_a_future</span>(name):</>,
    <>{'    '}<span className="kw">return</span> <span className="str">{`f"Hey {name}, let's ship."`}</span></>,
    <>{' '}</>,
    <><span className="fn">print</span>(build_a_future(<span className="str">{`"${firstName || 'you'}"`}</span>))</>,
    <>{' '}</>,
    <><span className="com"># your turn starts here </span><span className="cursor" /></>,
    <>{' '}</>,
    <>{' '}</>,
  ];
  return (
    <div className="codecard">
      <span className="codecard__streak">⚡ 7-day streak</span>
      <div className="codecard__bar">
        <i className="r" /><i className="y" /><i className="g" />
        <span>hello_world.py</span>
      </div>
      <pre className="codecard__body"><code>
        {lines.map((l, i) => <span className="ln" key={i}>{l}</span>)}
      </code></pre>
      <div className="codecard__toast">
        <i>✓</i>
        <span>
          <strong>First project</strong>
          <span>Unlocked just now</span>
        </span>
      </div>
      <div className="codecard__foot">Lesson 01 / 08</div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const catalog = useFetch('/catalog');
  const progress = useFetch('/progress');

  if (catalog.loading) return <Spinner />;
  if (catalog.error) return <div className="container"><ErrorText error={catalog.error} /></div>;

  const tracks = catalog.data.tracks;
  const rows = progress.data?.tracks || [];
  const byslug = Object.fromEntries(rows.map((r) => [r.track_slug, r]));

  const started = rows.filter((r) => Number(r.modules_completed) > 0);
  const resume = started.find((r) => Number(r.percent_complete) < 100) || started[0];
  const startSlug = resume?.track_slug || tracks[0]?.slug || 'python';
  const startLabel = resume ? 'Continue your last lesson' : 'Start your first lesson';
  const firstName = (user.fullName || '').split(/\s+/)[0];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <span className="home-badge">✦ Learn in public</span>
            <h1>Learn to code.<span>Build the future.</span></h1>
            <p className="home-hero__lede">
              A structured programming platform for students and educators —
              text lessons with real code, per-module quizzes, and proctored
              coding assessments.
            </p>
            <div className="home-cta">
              <Link className="btn-primary" to={`/tracks/${startSlug}`}>{startLabel} →</Link>
              <a className="btn-ghost" href="#tracks">See all tracks ↘</a>
            </div>
          </div>
          <div className="home-hero__art">
            <CodeCard firstName={firstName} />
          </div>
        </div>

        <div className="home-social">
          <div className="home-avatars">
            <span>AS</span><span>BC</span><span>CM</span><span>+</span>
          </div>
          <div>Join <strong>12,000+</strong> curious builders</div>
        </div>
      </section>

      <section id="tracks" className="home-tracks">
        <h2>{started.length ? 'Continue learning' : 'Choose a track'}</h2>
        <p className="muted">
          {started.length
            ? 'Pick up where you left off, or jump into something new.'
            : 'Eight tracks, from first principles to placement-ready.'}
        </p>
        <div className="grid">
          {tracks.map((t) => {
            const p = byslug[t.slug];
            const pct = p ? Number(p.percent_complete) || 0 : null;
            return (
              <Link key={t.id} to={`/tracks/${t.slug}`} className="home-track">
                <div className="home-track__top">
                  <h3>{t.title}</h3>
                  <span className="badge">{t.kind === 'coding' ? 'Coding' : 'Concepts'}</span>
                </div>
                <p>{t.description}</p>
                {pct !== null && (
                  <>
                    <div className="home-track__bar"><span style={{ width: `${pct}%` }} /></div>
                    <small>{pct}% complete · {p.modules_completed}/{p.modules_total} modules</small>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
