import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const login = (payload) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
    setUser(payload.user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export const roleHome = (role) =>
  role === 'SYSTEM_ADMIN'
    ? '/admin/dashboard'
    : role === 'STORE_OWNER'
      ? '/owner/dashboard'
      : '/user/stores';
