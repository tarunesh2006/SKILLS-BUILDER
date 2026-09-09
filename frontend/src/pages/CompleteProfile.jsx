import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorText } from '../components/common';

export default function CompleteProfile() {
  const { user, completeProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Already done? send them on.
  if (user && user.role === 'student' && !user.needsProfile) {
    return <Navigate to="/catalog" replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await completeProfile({ username: username.trim(), rollNumber: rollNumber.trim() });
      navigate('/catalog', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card stack" style={{ width: 400 }} onSubmit={submit}>
        <h2 style={{ margin: 0 }}>Finish setting up your account</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Signed in as <strong>{user?.email}</strong>. Pick a username and enter your
          roll number so instructors can identify your work.
        </p>

        <div>
          <label htmlFor="cp-user">Username</label>
          <input
            id="cp-user" autoFocus value={username}
            placeholder="e.g. asha.rao"
            onChange={(e) => setUsername(e.target.value)}
            minLength={3} maxLength={32} required
          />
          <p className="muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
            Letters, digits, dot, underscore and hyphen. 3–32 characters.
          </p>
        </div>

        <div>
          <label htmlFor="cp-roll">Roll number</label>
          <input
            id="cp-roll" value={rollNumber}
            placeholder="e.g. 421224104113"
            onChange={(e) => setRollNumber(e.target.value)}
            maxLength={32} required
          />
        </div>

        <ErrorText error={error} />
        <button disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
        <button type="button" className="secondary" onClick={() => { logout(); navigate('/login', { replace: true }); }}>
          Sign out
        </button>
      </form>
    </div>
  );
}
