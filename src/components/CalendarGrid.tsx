'use client';

import React from 'react';
import { Resource, Booking, Block, DEFAULT_PERIODS } from '@/lib/types';
import { useAuth } from './GoogleAuthProvider';
import { Monitor, Tablet, Video, Tv, Lock, Plus, Clock, Trash2 } from 'lucide-react';

interface CalendarGridProps {
  resources: Resource[];
  bookings: Booking[];
  blocks: Block[];
  selectedDate: string;
  onSelectSlot: (resourceId: string, periodId: string) => void;
  selectedShift: 'all' | 'matutino' | 'vespertino';
  onRefresh?: () => void;
}

export function CalendarGrid({
  resources,
  bookings,
  blocks,
  selectedDate,
  onSelectSlot,
  selectedShift,
  onRefresh,
}: CalendarGridProps) {
  const { user } = useAuth();

  const filteredPeriods = DEFAULT_PERIODS.filter((p) => {
    if (selectedShift === 'all') return true;
    return p.shift === selectedShift;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'tablet':
        return <Tablet className="w-5 h-5 text-emerald-600" />;
      case 'room':
        return <Monitor className="w-5 h-5 text-indigo-600" />;
      case 'equipment':
        return <Tv className="w-5 h-5 text-purple-600" />;
      default:
        return <Video className="w-5 h-5 text-blue-600" />;
    }
  };

  const handleDeleteBooking = async (bookingId: string, professorName: string) => {
    const isSelf = user?.role === 'admin' ? 'como Administrador' : 'sua própria reserva';
    if (!confirm(`Confirmar exclusão da reserva de ${professorName} (${isSelf})?`)) return;

    try {
      const res = await fetch(
        `/api/bookings?id=${bookingId}&userEmail=${encodeURIComponent(user?.email || '')}&userRole=${user?.role}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Não foi possível excluir.');
        return;
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Erro ao excluir a reserva.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              <th className="p-4 text-left font-bold text-xs text-gray-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Horário / Período
              </th>
              {resources.map((res) => (
                <th key={res.id} className="p-4 text-center min-w-[220px] max-w-[260px] border-l border-gray-200">
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-200 mb-1">
                      {getResourceIcon(res.type)}
                    </div>
                    <span className="font-bold text-sm text-gray-900 line-clamp-1">{res.name}</span>
                    <span className="text-xs text-gray-500 font-medium mt-0.5">
                      Capacidade: <strong className="text-gray-800">{res.totalQuantity}</strong> {res.type === 'tablet' ? 'unidades' : 'vaga'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPeriods.map((period) => (
              <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 sticky left-0 bg-white z-10 font-medium text-xs text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{period.shift.toUpperCase()}</span>
                  </div>
                  <div className="font-bold text-gray-900 text-sm">{period.name.split('(')[0]}</div>
                  <div className="text-gray-500 text-[11px] font-mono mt-0.5">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {resources.map((res) => {
                  const isBlocked = blocks.some(
                    (b) =>
                      b.date === selectedDate &&
                      (b.resourceId === 'all' || b.resourceId === res.id) &&
                      (b.periodId === 'all_day' || b.periodId === period.id)
                  );
                  const blockInfo = blocks.find(
                    (b) =>
                      b.date === selectedDate &&
                      (b.resourceId === 'all' || b.resourceId === res.id) &&
                      (b.periodId === 'all_day' || b.periodId === period.id)
                  );

                  const slotBookings = bookings.filter(
                    (b) => b.resourceId === res.id && b.date === selectedDate && b.periodId === period.id && b.status === 'active'
                  );

                  const totalReserved = slotBookings.reduce((sum, b) => sum + b.quantity, 0);
                  const availableQuantity = Math.max(0, res.totalQuantity - totalReserved);
                  const isFullyBooked = availableQuantity === 0 && res.totalQuantity > 0;
                  const isPartiallyBooked = totalReserved > 0 && availableQuantity > 0;

                  return (
                    <td key={res.id} className="p-3 border-l border-gray-200 align-top h-32">
                      {isBlocked ? (
                        <div className="h-full rounded-xl bg-slate-100 border border-slate-200 p-3 flex flex-col justify-between text-slate-600">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span>Bloqueado</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                            {blockInfo?.reason || 'Pré-Conselho'}
                          </p>
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-center">
                            Indisponível
                          </span>
                        </div>
                      ) : isFullyBooked ? (
                        <div className="h-full rounded-xl bg-rose-50 border border-rose-200 p-3 flex flex-col justify-between text-rose-900">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                                Lotado
                              </span>
                              <span className="text-[10px] text-rose-700 font-bold">
                                {totalReserved}/{res.totalQuantity}
                              </span>
                            </div>
                            {slotBookings.map((b) => {
                              const isAdmin = user?.role === 'admin';
                              const isMine = user?.email && b.professorEmail.toLowerCase() === user.email.toLowerCase();
                              const canDelete = isAdmin || isMine;

                              return (
                                <div key={b.id} className="mt-1 text-xs flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-rose-950 block truncate">{b.professorName}</span>
                                    <span className="text-[11px] text-rose-700 font-medium">Turma: {b.turma}</span>
                                  </div>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteBooking(b.id, b.professorName)}
                                      className="text-rose-400 hover:text-rose-800 p-1 rounded transition-colors"
                                      title="Excluir reserva"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-between">
                          {isPartiallyBooked && (
                            <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[10px] uppercase bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                                  Reserva Parcial
                                </span>
                                <span className="font-mono text-[11px] font-bold">
                                  {availableQuantity} livre(s)
                                </span>
                              </div>
                              {slotBookings.map((b) => {
                                const isAdmin = user?.role === 'admin';
                                const isMine = user?.email && b.professorEmail.toLowerCase() === user.email.toLowerCase();
                                const canDelete = isAdmin || isMine;

                                return (
                                  <div key={b.id} className="text-[11px] flex justify-between items-center truncate">
                                    <span className="truncate">
                                      <strong>{b.professorName}</strong> ({b.quantity} un.)
                                    </span>
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDeleteBooking(b.id, b.professorName)}
                                        className="text-amber-700 hover:text-rose-600 p-0.5 rounded ml-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button
                            onClick={() => onSelectSlot(res.id, period.id)}
                            className={`w-full h-full min-h-[64px] rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 transition-all group ${
                              isPartiallyBooked
                                ? 'bg-amber-50/50 border-amber-300 hover:bg-amber-100 hover:border-amber-400 text-amber-800'
                                : 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-500 text-emerald-800'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold">
                              {isPartiallyBooked ? `Reservar restantes (${availableQuantity})` : 'Agendar Recurso'}
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
