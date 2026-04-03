import { createContext, useContext, useState, useEffect } from 'react';
import { getMeApi, logoutApi } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('merchantai_user')) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeApi()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('merchantai_user', JSON.stringify(data.user));
      })
      .catch(() => {}) // not logged in
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('merchantai_user', JSON.stringify(userData));
  };

  const logout = async () => {
    await logoutApi().catch(() => {});
    setUser(null);
    localStorage.removeItem('merchantai_user');
  };

  return (
    <UserContext.Provider value={{ user, setUser: login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
