import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SiteHeader.css';

const TRACKS = [
  ['python', 'Python'], ['c', 'C'], ['cpp', 'C++'], ['java', 'Java'],
  ['mysql', 'MySQL'], ['mongodb', 'MongoDB'], ['react', 'React'], ['networking', 'Networking'],
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || '?';
}

const Chevron = () => (
  <svg className="sh-row__chev" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ICONS = {
  dashboard: <path d="M4 13h6V3H4v10Zm0 8h6v-6H4v6Zm10 0h6V11h-6v10Zm0-18v6h6V3h-6Z" />,
  path: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  test: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  content: <><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 9v11" /></>,
  reports: <><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
};

const Icon = ({ name }) => (
  <svg className="sh-sec__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

function Row({ to, label, onGo }) {
  return (
    <NavLink to={to} className="sh-row" onClick={onGo}>
      <span>{label}</span>
      <Chevron />
    </NavLink>
  );
}

function ProfilePanel({ user, roleLabel, onSignOut }) {
  const isAdmin = user.role === 'admin';
  return (
    <div className="sh-panel" role="menu">
      <div className="sh-panel__head">
        <span className="sh-panel__avatar">{initials(user.fullName)}</span>
        <div className="sh-panel__id">
          <strong>{user.fullName}</strong>
          <span>{roleLabel}</span>
        </div>
        <button type="button" className="sh-logout" onClick={onSignOut}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </div>

      {isAdmin ? (
        <div className="sh-sec">
          <div className="sh-sec__title"><Icon name="content" /> Manage</div>
          <Row to="/admin" label="Content manager" />
          <Row to="/admin/tests" label="Test creator" />
          <Row to="/admin/reports" label="Reports" />
          <Row to="/admin/users" label="People & admins" />
        </div>
      ) : (
        <>
          <div className="sh-sec">
            <div className="sh-sec__title"><Icon name="dashboard" /> Dashboard</div>
            <Row to="/catalog" label="My learning" />
          </div>
          <div className="sh-sec">
            <div className="sh-sec__title"><Icon name="path" /> Progress</div>
            <Row to="/progress" label="My path" />
            <Row to="/tests" label="My tests" />
          </div>
        </>
      )}

      <div className="sh-sec">
        <div className="sh-sec__title"><Icon name="user" /> Account</div>
        <div className="sh-kv"><span>{isAdmin ? 'Username' : 'Email'}</span>
          <b>{user.email || user.rollNumber || user.username}</b></div>
        {!isAdmin && user.rollNumber && (
          <div className="sh-kv"><span>Roll number</span><b>{user.rollNumber}</b></div>
        )}
        <div className="sh-kv"><span>Role</span><b>{roleLabel}</b></div>
      </div>
    </div>
  );
}

function UserBadge({ user, roleLabel, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="sh-badge-wrap" ref={ref}>
      <button
        className={`sh-badge${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sh-badge__avatar">{initials(user.fullName)}</span>
        <span className="sh-badge__text">
          <b>{user.fullName}</b>
          <i>{roleLabel}</i>
        </span>
        <svg className="sh-badge__caret" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ProfilePanel
          user={user}
          roleLabel={roleLabel}
          onSignOut={() => { setOpen(false); onSignOut(); }}
        />
      )}
      {open && <div className="sh-panel-scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Auth screens carry their own branding; don't show the app chrome.
  if (pathname === '/login' || pathname === '/admin/login' || !user) return null;

  const isAdmin = user.role === 'admin';
  const home = isAdmin ? '/admin' : '/catalog';
  const roleLabel = isAdmin ? 'Administrator' : 'Learner';

  return (
    <header className="sh">
      <div className="sh-bar">
        <Link to={home} className="sh-logo">
          <span className="sh-logo__mark">&gt;_</span>
          Skill Builder
        </Link>

        <nav className="sh-nav">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end>Content</NavLink>
              <NavLink to="/admin/tests">Tests</NavLink>
              <NavLink to="/admin/reports">Reports</NavLink>
              <NavLink to="/admin/users">People</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/catalog" end>Catalog</NavLink>
              <NavLink to="/progress">My path</NavLink>
              <NavLink to="/tests">Tests</NavLink>
            </>
          )}
        </nav>

        <UserBadge
          user={user}
          roleLabel={roleLabel}
          onSignOut={() => { logout(); navigate('/login', { replace: true }); }}
        />
      </div>

      {!isAdmin && (
        <div className="sh-tracks">
          <span className="sh-tracks__label">LEARN</span>
          {TRACKS.map(([slug, label]) => (
            <NavLink key={slug} to={`/tracks/${slug}`} className="sh-chip">{label}</NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
