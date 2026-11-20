'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './GoogleAuthProvider';
import { Calendar, CheckSquare, Shield, LogOut, Menu, X, RefreshCw } from 'lucide-react';

export function TopBar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'IR';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navLinks = [
    { href: '/', label: 'Agenda', icon: Calendar },
    { href: '/minhas-reservas', label: 'Minhas Reservas', icon: CheckSquare },
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: 'Painel Admin', icon: Shield }]
      : []),
  ];

  return (
    <>
      {/* TOP HEADER BAR */}
      <header className="bg-[#111625] text-white border-b border-slate-800/80 sticky top-0 z-40 w-full shadow-lg font-sans">
        <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left section: Drawer Toggle + Brand Name */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Abrir Menu de Navegação"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-950/50 group-hover:scale-105 transition-transform shrink-0 tracking-wider">
                IR
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight block">
                  Integra Rizzi
                </span>
                <span className="text-[10px] sm:text-[11px] text-indigo-300 font-medium block">
                  CE Pedro Rizzi
                </span>
              </div>
            </Link>
          </div>

          {/* Center/Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right section: User Profile, Role Switch, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && (
              <>
                {/* User Info (Desktop) */}
                <div className="hidden lg:flex items-center space-x-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center border border-indigo-400 shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="text-left text-xs max-w-[140px] truncate">
                    <p className="font-bold text-white truncate leading-tight">{user.name}</p>
                    <span className="text-[10px] text-indigo-300 font-semibold block capitalize leading-none">
                      {user.role === 'admin' ? 'Administrador' : 'Professor'}
                    </span>
                  </div>
                </div>

                {/* Role Switcher */}
                <button
                  onClick={() => switchRole(user.role === 'admin' ? 'professor' : 'admin')}
                  className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-800/60"
                  title="Alternar Papel Admin/Professor"
                >
                  {user.role === 'admin' ? 'Prof' : 'Admin'}
                </button>

                {/* Sair / Logout */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-200 hover:border-rose-800/60 text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-700/60 transition-colors"
                  title="Sair do Sistema"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* OFF-CANVAS SLIDE-OVER DRAWER (HIDDEN BY DEFAULT, OPENS ON DEMAND) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-[#111625] h-full shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {/* Top Drawer Header */}
            <div>
              <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-900/40 shrink-0 tracking-wider">
                    IR
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                      Integra Rizzi
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      CE Pedro Rizzi
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Fechar Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation in Drawer */}
              <div className="p-4 space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-2">
                  NAVEGAÇÃO
                </span>
                <nav className="space-y-1.5">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom User Info & Actions in Drawer */}
            <div className="p-4 border-t border-slate-800/80 bg-[#0d111d]">
              {user && (
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
                      onClick={() => {
                        logout();
                        setIsDrawerOpen(false);
                      }}
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
