'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loginGoogle: () => Promise<void>;
  login: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loginGoogle: async () => {},
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Carregar do cache local primeiro
    const saved = localStorage.getItem('cepr_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || 'usuario@pedrorizzi.edu.br';
        const name = firebaseUser.displayName || 'Usuário Google';
        const avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

        // Se for Elevi ou primeiro login -> admin
        const isAdmin = email.includes('elcortelini') || email.includes('admin');
        const newUser: User = {
          id: firebaseUser.uid,
          name,
          email,
          avatar,
          role: isAdmin ? 'admin' : 'professor',
        };

        setUser(newUser);
        localStorage.setItem('cepr_user', JSON.stringify(newUser));
      }
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Erro ao fazer login com Google:', e);
      alert('Não foi possível realizar a autenticação com o Google.');
    }
  };

  const login = async (userData: Partial<User>) => {
    const newUser: User = {
      id: userData.id || `usr-${Date.now()}`,
      name: userData.name || 'Usuário',
      email: userData.email || 'usuario@pedrorizzi.edu.br',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: (userData.role as UserRole) || 'professor',
    };
    setUser(newUser);
    localStorage.setItem('cepr_user', JSON.stringify(newUser));
  };

  const logout = () => {
    signOut(auth).catch(() => {});
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
    <AuthContext.Provider value={{ user, loginGoogle, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
