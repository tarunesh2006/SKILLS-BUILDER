import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorText } from '../components/common';

export default function Login({ kind }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = kind === 'admin';
  const idLabel = isAdmin ? 'Username' : 'Roll number';

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const creds = isAdmin
        ? { username: form.id, password: form.password }
        : { rollNumber: form.id, password: form.password };
      const user = await login(kind, creds);
      navigate(user.role === 'admin' ? '/admin' : '/catalog', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card stack" style={{ width: 340 }} onSubmit={submit}>
        <h2>{isAdmin ? 'Admin sign in' : 'Student sign in'}</h2>
        <div>
          <label>{idLabel}</label>
          <input
            autoFocus
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <ErrorText error={error} />
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted" style={{ fontSize: 13 }}>
          {isAdmin
            ? <Link to="/login">Student sign in</Link>
            : <Link to="/admin/login">Admin sign in</Link>}
        </p>
      </form>
    </div>
  );
}
