import { Navigate } from 'react-router-dom';
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
export function RequireAuth({ role, children, allowIncompleteProfile = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  if (!allowIncompleteProfile && user.role === 'student' && user.needsProfile) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
}

