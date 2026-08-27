'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './GoogleAuthProvider';
import { Calendar, CheckSquare, Shield, LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'CEPR';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-[#111625] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30 font-sans">
      {/* Top Header Logo */}
      <div>
        <div className="p-5 flex items-center space-x-3 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-900/40 shrink-0 tracking-wider">
            CEPR
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
              Agenda CEPR
            </h1>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              CE Pedro Rizzi
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 space-y-6">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3 px-2">
              NAVEGAÇÃO
            </span>
            <nav className="space-y-1.5">
              <Link
                href="/"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Agenda</span>
              </Link>

              <Link
                href="/minhas-reservas"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === '/minhas-reservas'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span>Minhas Reservas</span>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/admin'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Painel Admin</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-800/60 bg-[#0d111d]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-400 shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white leading-tight truncate">{user.name}</p>
                <span className="text-[10px] text-slate-400 font-medium block capitalize">
                  {user.role === 'admin' ? 'Administrador' : 'Professor'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>

              <button
                onClick={() => switchRole(user.role === 'admin' ? 'professor' : 'admin')}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/80 px-2 py-1.5 rounded-lg transition-colors border border-indigo-800/50"
                title="Alternar Papel Admin/Professor"
              >
                {user.role === 'admin' ? 'Prof' : 'Admin'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              Fazer Login
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
