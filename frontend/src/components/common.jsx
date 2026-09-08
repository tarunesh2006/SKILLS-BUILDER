import { NavLink, Navigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';

export function Spinner({ label = 'Loading…' }) {
  return <div className="center muted">{label}</div>;
}

export function ErrorText({ error }) {
  if (!error) return null;
  return <p className="error">{typeof error === 'string' ? error : error.message}</p>;
}

export function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>
    </div>
  );
}

// Inline markdown (no block <p> wrapper) — for option labels, table cells, etc.
const INLINE_COMPONENTS = { p: ({ children }) => <>{children}</> };
export function MarkdownInline({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={INLINE_COMPONENTS}>
      {children || ''}
    </ReactMarkdown>
  );
}

export function ProgressBar({ percent }) {
  return (
    <div className="bar" title={`${percent ?? 0}%`}>
      <span style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }} />
    </div>
  );
}

/** Route guard: requires a logged-in user, optionally of a given role. */
export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

const NO_CHROME = ['/login', '/admin/login'];

export function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = user?.role === 'admin';

  // The sign-in screen is a full-bleed layout with its own branding.
  if (NO_CHROME.includes(pathname)) return null;

  return (
    <header className="topbar">
      <div className="brand">Skill Builder</div>
      <nav>
        {user && !isAdmin && (
          <>
            <NavLink to="/" end>Catalog</NavLink>
            <NavLink to="/progress">Progress</NavLink>
            <NavLink to="/tests">Tests</NavLink>
          </>
        )}
        {isAdmin && (
          <>
            <NavLink to="/admin" end>Content</NavLink>
            <NavLink to="/admin/tests">Tests</NavLink>
            <NavLink to="/admin/reports">Reports</NavLink>
          </>
        )}
        {user
          ? <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Sign out ({user.fullName})</a>
          : <NavLink to="/login">Sign in</NavLink>}
      </nav>
    </header>
  );
}
