import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => { setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (kind, credentials) => {
    const path = kind === 'admin' ? '/auth/admin/login' : '/auth/student/login';
    const d = await api(path, { method: 'POST', body: credentials, auth: false });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  // Google Sign-In: exchange the GIS credential (ID token) for our JWT.
  const loginWithGoogle = useCallback(async (credential) => {
    const d = await api('/auth/google', { method: 'POST', body: { credential }, auth: false });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  // First-login profile completion (username + roll number).
  const completeProfile = useCallback(async ({ username, rollNumber }) => {
    const d = await api('/auth/profile', { method: 'PUT', body: { username, rollNumber } });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, completeProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
