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

function ProfileMenu({ user, onSignOut }) {
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

  const isAdmin = user.role === 'admin';

  return (
    <div className="sh-profile" ref={ref}>
      <button
        className="sh-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        {initials(user.fullName)}
      </button>
      {open && (
        <div className="sh-menu" role="menu">
          <div className="sh-menu__head">
            <strong>{user.fullName}</strong>
            <span>{user.email || user.rollNumber || user.username}</span>
          </div>
          {isAdmin ? (
            <>
              <NavLink to="/admin" role="menuitem" onClick={() => setOpen(false)}>Content manager</NavLink>
              <NavLink to="/admin/reports" role="menuitem" onClick={() => setOpen(false)}>Reports</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/progress" role="menuitem" onClick={() => setOpen(false)}>My path</NavLink>
              <NavLink to="/tests" role="menuitem" onClick={() => setOpen(false)}>My tests</NavLink>
            </>
          )}
          <button type="button" className="sh-signout" role="menuitem" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
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
            </>
          ) : (
            <>
              <NavLink to="/catalog" end>Catalog</NavLink>
              <NavLink to="/progress">My path</NavLink>
              <NavLink to="/tests">Tests</NavLink>
            </>
          )}
        </nav>

        <ProfileMenu
          user={user}
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
