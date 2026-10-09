import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isCandidate: boolean;
  isCompanyMember: boolean;
  isSuperAdmin: boolean;
  activeCompanyId: string | null;
  setActiveCompanyId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hiresphere_token'));
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (token) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        if (currentUser.companies.length > 0 && !activeCompanyId) {
          setActiveCompanyId(currentUser.companies[0].companyId);
        }
      }
    } catch {
      localStorage.removeItem('hiresphere_token');
      localStorage.removeItem('hiresphere_refresh');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (authResponse: AuthResponse) => {
    localStorage.setItem('hiresphere_token', authResponse.accessToken);
    localStorage.setItem('hiresphere_refresh', authResponse.refreshToken);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);
    if (authResponse.user.companies.length > 0) {
      setActiveCompanyId(authResponse.user.companies[0].companyId);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('hiresphere_token');
      localStorage.removeItem('hiresphere_refresh');
      setToken(null);
      setUser(null);
      setActiveCompanyId(null);
      window.location.href = '/login';
    }
  };

  const isCandidate = Boolean(user?.roles.includes('Candidate'));
  const isCompanyMember = Boolean(user?.roles.includes('CompanyMember'));
  const isSuperAdmin = Boolean(user?.roles.includes('SuperAdmin'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        refreshUser: fetchCurrentUser,
        isCandidate,
        isCompanyMember,
        isSuperAdmin,
        activeCompanyId,
        setActiveCompanyId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
