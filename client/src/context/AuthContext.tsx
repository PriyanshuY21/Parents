import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import api from '../services/api';
import { AuthUser, AuthContextValue } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hl_token');
    const stored = localStorage.getItem('hl_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('hl_token');
        localStorage.removeItem('hl_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('hl_token', data.token);
    localStorage.setItem('hl_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem('hl_token', data.token);
      localStorage.setItem('hl_user', JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('hl_token');
    localStorage.removeItem('hl_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
