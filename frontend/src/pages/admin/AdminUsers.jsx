import { useState } from 'react';
import { useFetch } from '../useApi';
import { api } from '../../api/client';
import { Spinner, ErrorText } from '../../components/common';

const BLANK = () => ({
  role: 'student', fullName: '', username: '', rollNumber: '', email: '', password: '',
});

function suggestPassword() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#$%@';
  let s = '';
  for (let i = 0; i < 14; i += 1) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export default function AdminUsers() {
  const { data, error, loading, reload } = useFetch('/admin/users');
  const [form, setForm] = useState(BLANK());
  const [created, setCreated] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function create(e) {
    e.preventDefault();
    setBusy(true); setFormError(null); setCreated(null);
    try {
      const body = {
        role: form.role,
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        ...(form.role === 'admin'
          ? { username: form.username.trim() }
          : { rollNumber: form.rollNumber.trim() }),
      };
      const { user } = await api('/admin/users', { method: 'POST', body });
      setCreated({ user, password: form.password });
      setForm(BLANK());
      reload();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  }

  async function patch(id, patchBody, label) {
    if (label && !confirm(label)) return;
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: patchBody });
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  async function resetPassword(u) {
    const pw = prompt(`New password for ${u.username || u.rollNumber} (min 6 chars):`, suggestPassword());
    if (!pw) return;
    if (pw.length < 6) { alert('Password must be at least 6 characters'); return; }
    await patch(u.id, { password: pw });
    alert(`Password for ${u.username || u.rollNumber} is now:\n\n${pw}\n\nShare it securely — it is not stored in plain text.`);
  }

  const users = data?.users || [];
  const admins = users.filter((u) => u.role === 'admin');
  const students = users.filter((u) => u.role === 'student');

  return (
    <div className="container">
      <h1>People</h1>
      <p className="muted">Create and manage student and admin accounts. Passwords are stored hashed — a reset shows the new one once.</p>
      <ErrorText error={error} />

      <form className="card stack" onSubmit={create}>
        <h3>Add a user</h3>
        <div>
          <label>Role</label>
          <select value={form.role} onChange={(e) => set({ role: e.target.value })}>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div><label>Full name</label>
          <input value={form.fullName} required onChange={(e) => set({ fullName: e.target.value })} /></div>

        {form.role === 'admin' ? (
          <div><label>Username (admin login)</label>
            <input value={form.username} required placeholder="e.g. jane.admin"
              onChange={(e) => set({ username: e.target.value })} /></div>
        ) : (
          <div><label>Roll number</label>
            <input value={form.rollNumber} required placeholder="e.g. S010"
              onChange={(e) => set({ rollNumber: e.target.value })} /></div>
        )}

        <div><label>Email {form.role === 'student' ? '(students can also sign in with this)' : '(optional)'}</label>
          <input type="email" value={form.email}
            onChange={(e) => set({ email: e.target.value })} /></div>

        <div>
          <label>Password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.password} required minLength={6}
              onChange={(e) => set({ password: e.target.value })} />
            <button type="button" className="secondary" style={{ whiteSpace: 'nowrap' }}
              onClick={() => set({ password: suggestPassword() })}>Suggest</button>
          </div>
        </div>

        <ErrorText error={formError} />
        <button disabled={busy}>{busy ? 'Creating…' : `Create ${form.role}`}</button>

        {created && (
          <div className="card" style={{ background: 'var(--ok-weak)', borderColor: 'var(--ok)', marginTop: 8 }}>
            <strong>{created.user.role === 'admin' ? 'Admin' : 'Student'} created.</strong>
            <table style={{ marginTop: 8 }}>
              <tbody>
                <tr><td>Name</td><td>{created.user.fullName}</td></tr>
                <tr><td>{created.user.role === 'admin' ? 'Username' : 'Roll number'}</td>
                  <td>{created.user.username || created.user.rollNumber}</td></tr>
                {created.user.email && <tr><td>Email</td><td>{created.user.email}</td></tr>}
                <tr><td>Password</td><td><code>{created.password}</code></td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
              Copy the password now — it is not shown again.
            </p>
          </div>
        )}
      </form>

      <UserTable title="Admins" users={admins} idKey="username"
        onPatch={patch} onReset={resetPassword} />
      <UserTable title="Students" users={students} idKey="rollNumber"
        onPatch={patch} onReset={resetPassword} />
    </div>
  );
}

function UserTable({ title, users, idKey, onPatch, onReset }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title} ({users.length})</h3>
      <table>
        <thead>
          <tr>
            <th>{idKey === 'username' ? 'Username' : 'Roll'}</th>
            <th>Name</th><th>Email</th><th>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u[idKey]}</td>
              <td>{u.fullName}</td>
              <td className="muted">{u.email || '—'}</td>
              <td>{u.isActive
                ? <span className="badge ok">active</span>
                : <span className="badge err">disabled</span>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="secondary" style={{ padding: '3px 8px' }}
                  onClick={() => onReset(u)}>Reset password</button>{' '}
                <button className="secondary" style={{ padding: '3px 8px' }}
                  onClick={() => onPatch(
                    u.id,
                    { isActive: !u.isActive },
                    u.isActive ? `Disable ${u[idKey]}? They will not be able to sign in.` : null,
                  )}>
                  {u.isActive ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={5} className="muted">None yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
