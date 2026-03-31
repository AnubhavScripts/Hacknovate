import { useState, useEffect, createContext, useContext } from 'react';
import { getMe, mockLogin as apiMockLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check persisted session
    const stored = localStorage.getItem('merchantai_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }

    getMe()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('merchantai_user', JSON.stringify(data.user));
      })
      .catch(() => {
        // Not logged in — check localStorage only
      })
      .finally(() => setLoading(false));
  }, []);

  const mockLogin = async (name = 'Demo Merchant', email = 'demo@merchantai.app') => {
    const { data } = await apiMockLogin(name, email);
    setUser(data.user);
    localStorage.setItem('merchantai_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    setUser(null);
    localStorage.removeItem('merchantai_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, mockLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
