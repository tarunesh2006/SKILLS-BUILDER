import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Logo() {
  return (
    <span className="auth__logo">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="1" y="14" width="5" height="11" rx="1.5" fill="#1aa3e8" />
        <rect x="8" y="9" width="5" height="16" rx="1.5" fill="#4bc0f5" />
        <rect x="15" y="4" width="5" height="21" rx="1.5" fill="#1aa3e8" />
        <rect x="22" y="10" width="4" height="15" rx="1.5" fill="#8fd8fa" />
      </svg>
      Skill&nbsp;Builder
    </span>
  );
}

/* decorative node graph */
function Diagram() {
  const nodes = [
    [70, 40, 'CLOUD'], [150, 95, 'COURSE'], [40, 130, 'MODULE'],
    [175, 165, 'DATA'], [260, 70, 'CLIENT'], [250, 155, 'JUDGE'],
  ];
  const edges = [[0, 1], [1, 2], [1, 3], [0, 4], [4, 5], [3, 5], [2, 3]];
  return (
    <svg className="auth__diagram" viewBox="0 0 300 210" fill="none" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#9fc0d8" strokeWidth="1" strokeDasharray="3 4"
        />
      ))}
      {nodes.map(([x, y, label], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="10" fill="#ffffff" stroke="#7fabc9" strokeWidth="1.5" />
          <circle cx={x} cy={y} r="3.5" fill={i === 1 ? '#1aa3e8' : '#7fb4d4'} />
          <text x={x} y={y + 24} fill="#6b8296" fontSize="8" textAnchor="middle" letterSpacing="1">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {off
      ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6 0 10 8 10 8a17.6 17.6 0 0 1-3.4 4.3M6.6 6.6A17.7 17.7 0 0 0 2 12s4 8 10 8a10.7 10.7 0 0 0 5.4-1.4" /></>
      : <><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
);

const ROLE_PILL = {
  student: { icon: '🎓', text: 'Student portal — courses & progress' },
  admin: { icon: '🛠️', text: 'Admin portal — manage content & tests' },
};

export default function Login({ defaultRole = 'student' }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(defaultRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const isStudent = role === 'student';

  function switchRole(next) {
    setRole(next);
    setError(null);
    setInfo(null);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    try {
      let creds;
      if (isStudent) {
        creds = identifier.includes('@')
          ? { email: identifier.trim(), password }
          : { rollNumber: identifier.trim(), password };
      } else {
        creds = { username: identifier.trim(), password };
      }
      const user = await login(role, creds);
      navigate(user.role === 'admin' ? '/admin' : '/catalog', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth__brand">
        <Logo />
        <Diagram />
        <div>
          <h1 className="auth__headline">Learn to Code.<span>Build the Future.</span></h1>
          <p className="auth__tagline">
            A structured programming platform for students and educators —
            guided paths, module quizzes, and proctored coding assessments.
          </p>
        </div>
        <p className="auth__copyright">© 2026 Skill Builder Platform</p>
      </aside>

      <main className="auth__panel">
        <form className="auth__form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="auth__sub">Sign in to continue to Skill Builder</p>

          <div className="auth__seg" role="tablist" aria-label="Account type">
            <button type="button" role="tab" aria-selected={isStudent}
              onClick={() => switchRole('student')}>Student</button>
            <button type="button" role="tab" aria-selected={!isStudent}
              onClick={() => switchRole('admin')}>Admin</button>
          </div>

          <div className="auth__pill">
            <span aria-hidden="true">{ROLE_PILL[role].icon}</span>
            {ROLE_PILL[role].text}
          </div>

          {isStudent && (
            <>
              <button type="button" className="auth__oauth"
                onClick={() => setInfo('Google sign-in isn’t configured yet — use your email and password below.')}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z" />
                  <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.4 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 6.68 9.14 4.75 12 4.75Z" />
                </svg>
                Continue with Google
              </button>
              <div className="auth__divider">or sign in with email</div>
            </>
          )}

          {error && <p className="auth__error">{error}</p>}

          <div className="auth__field">
            <label htmlFor="auth-id">{isStudent ? 'Email address' : 'Username'}</label>
            <div className="auth__input">
              <input
                id="auth-id"
                type={isStudent ? 'text' : 'text'}
                inputMode={isStudent ? 'email' : 'text'}
                autoComplete={isStudent ? 'username' : 'username'}
                placeholder={isStudent ? 'you@university.edu' : 'admin'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="auth__field">
            <div className="auth__labelrow">
              <label htmlFor="auth-pw">Password</label>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setInfo('Password reset isn’t available yet — contact your administrator.');
              }}>Forgot password?</a>
            </div>
            <div className="auth__input auth__input--pw">
              <input
                id="auth-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="auth__eye"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((s) => !s)}>
                <EyeIcon off={showPw} />
              </button>
            </div>
          </div>

          <button className="auth__submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>

          {info && <p className="auth__info">{info}</p>}

          <p className="auth__note">
            By signing in, you agree to our <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
            {' & '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </p>
        </form>
      </main>
    </div>
  );
}
