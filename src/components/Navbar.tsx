'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './GoogleAuthProvider';
import { Calendar, CheckSquare, Shield, LogOut, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, login, logout, switchRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleSimulatedGoogleLogin = async (role: 'professor' | 'admin') => {
    const email = role === 'admin' ? 'admin@pedrorizzi.edu.br' : 'elevi.cortolini@pedrorizzi.edu.br';
    const name = role === 'admin' ? 'Coordenador / Admin' : 'Elevi Cortolini';
    const avatar = role === 'admin' 
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' 
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    await login({ email, name, avatar });
    setShowGoogleModal(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform tracking-wider">
                CEPR
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-none">
                  Agenda CEPR
                </span>
                <span className="text-xs text-indigo-600 font-medium block mt-1">
                  CE Pedro Rizzi
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda de Recursos</span>
            </Link>

            <Link
              href="/minhas-reservas"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/minhas-reservas'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Minhas Reservas</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === '/admin'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Painel Admin</span>
              </Link>
            )}
          </nav>

          {/* User Profile & Google Login */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-200"
                  />
                  <div className="text-left hidden sm:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                      {user.role === 'admin' ? '🛡️ Administrador' : '👨‍🏫 Professor'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Google SSO (CEPR)
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          switchRole(user.role === 'admin' ? 'professor' : 'admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5" />
                          Trocar para {user.role === 'admin' ? 'Professor' : 'Admin'}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 px-2 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowGoogleModal(true)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887c-.58 2.765-2.83 4.887-5.887 4.887-3.535 0-6.4-2.865-6.4-6.4s2.865-6.4 6.4-6.4c1.62 0 3.09.61 4.22 1.62l2.4-2.4C17.96 3.29 15.28 2.4 12.24 2.4 6.94 2.4 2.64 6.7 2.64 12s4.3 9.6 9.6 9.6c5.58 0 9.28-3.92 9.28-9.44 0-.64-.06-1.25-.17-1.875H12.24z"/>
                </svg>
                <span>Login com Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Google Login Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Login no Sistema CEPR</h3>
              <p className="text-xs text-slate-500 mt-1">
                Centro Educacional Pedro Rizzi
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSimulatedGoogleLogin('professor')}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-bold shadow-sm transition-all text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Entrar como Professor (Google SSO)</span>
              </button>

              <button
                onClick={() => handleSimulatedGoogleLogin('admin')}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 px-4 rounded-xl font-bold transition-all text-sm border border-indigo-200"
              >
                <Shield className="w-4 h-4" />
                <span>Entrar como Administrador</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center">
                Centro Educacional Pedro Rizzi - Agenda CEPR
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
