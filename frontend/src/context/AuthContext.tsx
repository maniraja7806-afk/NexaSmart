import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canControlDevices: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS: Record<UserRole, { email: string; name: string; dept: string }> = {
  'Super Admin': { email: 'superadmin@nexasmart.io', name: 'Dr. Evelyn Carter', dept: 'Central IT Administration' },
  'Campus Administrator': { email: 'campusadmin@nexasmart.io', name: 'Marcus Vance', dept: 'Campus Operations' },
  'Facility Manager': { email: 'facility@nexasmart.io', name: 'Elena Rostova', dept: 'Physical Facilities' },
  'Security Officer': { email: 'security@nexasmart.io', name: 'Chief Thomas Reyes', dept: 'Campus Safety & Protection' },
  'Maintenance Technician': { email: 'technician@nexasmart.io', name: 'Liam Chen', dept: 'HVAC & Electrical Support' },
  'Energy Manager': { email: 'energy@nexasmart.io', name: 'Amara Okafor', dept: 'Sustainability & Power' },
  'Water Manager': { email: 'water@nexasmart.io', name: 'Diego Morales', dept: 'Water Infrastructure' },
  'Department Administrator': { email: 'department@nexasmart.io', name: 'Prof. Sarah Jenkins', dept: 'School of Engineering' },
  'Viewer': { email: 'viewer@nexasmart.io', name: 'Campus Auditor', dept: 'External Audit' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('nexasmart_token');
    const savedUser = localStorage.getItem('nexasmart_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('nexasmart_token');
        localStorage.removeItem('nexasmart_user');
      }
    } else {
      // Default auto-login as Super Admin for demonstration smooth onboarding
      const defaultRole: UserRole = 'Super Admin';
      const info = DEMO_USERS[defaultRole];
      const mockUser: User = {
        id: 'usr_super_admin_demo',
        name: info.name,
        email: info.email,
        role: defaultRole,
        department: info.dept,
      };
      setUser(mockUser);
      setToken('demo_token_super_admin');
      localStorage.setItem('nexasmart_user', JSON.stringify(mockUser));
      localStorage.setItem('nexasmart_token', 'demo_token_super_admin');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: authUser, accessToken } = res.data.data;
      setUser(authUser);
      setToken(accessToken);
      localStorage.setItem('nexasmart_token', accessToken);
      localStorage.setItem('nexasmart_user', JSON.stringify(authUser));
    } catch (err: any) {
      // If backend is offline or network error, check demo list
      const cleanEmail = email.toLowerCase().trim();
      const matchedRole = (Object.keys(DEMO_USERS) as UserRole[]).find(
        (r) => DEMO_USERS[r].email === cleanEmail
      );
      if (matchedRole && password === 'Password123!') {
        const info = DEMO_USERS[matchedRole];
        const fallbackUser: User = {
          id: `usr_${matchedRole.toLowerCase().replace(/\s+/g, '_')}`,
          name: info.name,
          email: info.email,
          role: matchedRole,
          department: info.dept,
        };
        setUser(fallbackUser);
        setToken(`mock_token_${matchedRole}`);
        localStorage.setItem('nexasmart_token', `mock_token_${matchedRole}`);
        localStorage.setItem('nexasmart_user', JSON.stringify(fallbackUser));
        return;
      }
      throw new Error(err.response?.data?.error || 'Authentication failed');
    }
  };

  const loginAsRole = async (role: UserRole) => {
    const info = DEMO_USERS[role];
    try {
      await login(info.email, 'Password123!');
    } catch (err) {
      // Fallback direct set
      const fallbackUser: User = {
        id: `usr_${role.toLowerCase().replace(/\s+/g, '_')}`,
        name: info.name,
        email: info.email,
        role: role,
        department: info.dept,
      };
      setUser(fallbackUser);
      setToken(`mock_token_${role}`);
      localStorage.setItem('nexasmart_token', `mock_token_${role}`);
      localStorage.setItem('nexasmart_user', JSON.stringify(fallbackUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexasmart_token');
    localStorage.removeItem('nexasmart_user');
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return roles.includes(user.role);
  };

  const canControlDevices = (): boolean => {
    if (!user) return false;
    return user.role !== 'Viewer';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginAsRole,
        logout,
        hasRole,
        canControlDevices,
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
