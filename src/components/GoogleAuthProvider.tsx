'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
});

const DEFAULT_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-example.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cepr_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('cepr_user');
      }
    } else {
      const defaultUser: User = {
        id: 'usr-google-prof',
        name: 'Elevi Cortolini',
        email: 'elevi.cortolini@pedrorizzi.edu.br',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'professor',
      };
      setUser(defaultUser);
      localStorage.setItem('cepr_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('cepr_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Login error:', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cepr_user');
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    localStorage.setItem('cepr_user', JSON.stringify(updated));
  };

  return (
    <GoogleOAuthProvider clientId={DEFAULT_GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, login, logout, switchRole }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
