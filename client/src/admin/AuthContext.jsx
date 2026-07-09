import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  // `checking` is true until we know whether a stored token is still valid.
  // Without it, ProtectedRoute would bounce a signed-in admin to /login on refresh.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setChecking(false);
      return;
    }

    api
      .get('/admin/auth/me')
      .then(({ data }) => setAdmin(data.admin))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/admin/auth/login', { email, password });
    tokenStore.set(data.token);
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, checking, login, logout }), [admin, checking, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
