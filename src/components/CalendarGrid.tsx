'use client';

import React from 'react';
import { Resource, Booking, Block, DEFAULT_PERIODS } from '@/lib/types';
import { Lock, Clock, Plus, Trash2, Monitor, Tablet, Presentation, Sparkles } from 'lucide-react';
import { useAuth } from './GoogleAuthProvider';

interface CalendarGridProps {
  resources: Resource[];
  bookings: Booking[];
  blocks: Block[];
  selectedDate: string;
  onSelectSlot: (resourceId: string, periodId: string) => void;
  selectedShift?: 'matutino' | 'vespertino' | 'all';
  onRefresh?: () => void;
}

export function CalendarGrid({
  resources,
  bookings,
  blocks,
  selectedDate,
  onSelectSlot,
  selectedShift = 'all',
  onRefresh,
}: CalendarGridProps) {
  const { user } = useAuth();

  const filteredPeriods = DEFAULT_PERIODS.filter((p) => {
    if (selectedShift === 'all') return true;
    return p.shift === selectedShift;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <Presentation className="w-5 h-5 text-indigo-600" />;
      case 'equipment':
        return <Monitor className="w-5 h-5 text-emerald-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-amber-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

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
                  const isMatutino = period.shift === 'matutino';
                  const isVespertino = period.shift === 'vespertino';

                  const isBlocked = blocks.some(
                    (b) =>
                      b.date === selectedDate &&
                      (b.resourceId === 'all' || b.resourceId === res.id) &&
                      (
                        b.periodId === 'all_day' ||
                        b.periodId === period.id ||
                        (b.periodId === 'matutino' && isMatutino) ||
                        (b.periodId === 'vespertino' && isVespertino)
                      )
                  );
                  const blockInfo = blocks.find(
                    (b) =>
                      b.date === selectedDate &&
                      (b.resourceId === 'all' || b.resourceId === res.id) &&
                      (
                        b.periodId === 'all_day' ||
                        b.periodId === period.id ||
                        (b.periodId === 'matutino' && isMatutino) ||
                        (b.periodId === 'vespertino' && isVespertino)
                      )
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
                            {blockInfo?.reason || 'Bloqueado'}
                          </p>
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-center">
                            Indisponível
                          </span>
                        </div>
                      ) : isFullyBooked ? (
                        <div className="h-full rounded-xl bg-indigo-50/60 border border-indigo-100 p-2.5 flex flex-col justify-between">
                          <div className="space-y-1.5 overflow-y-auto max-h-[85px] pr-1">
                            {slotBookings.map((b) => {
                              const isAdmin = user?.role === 'admin';
                              const isMine = user?.email && b.professorEmail.toLowerCase() === user.email.toLowerCase();
                              const canDelete = isAdmin || isMine;

                              return (
                                <div
                                  key={b.id}
                                  className="bg-white rounded-lg p-2 border border-indigo-200/80 shadow-2xs text-xs flex items-center justify-between"
                                >
                                  <div className="truncate pr-1">
                                    <span className="font-bold text-gray-900 block truncate">{b.professorName}</span>
                                    {b.turma && <span className="text-[10px] text-indigo-700 font-extrabold">{b.turma}</span>}
                                  </div>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteBooking(b.id)}
                                      className="text-gray-400 hover:text-rose-600 p-1 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-center mt-1">
                            Reservado
                          </span>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-between">
                          {isPartiallyBooked && (
                            <div className="space-y-1 overflow-y-auto max-h-[60px] mb-1">
                              {slotBookings.map((b) => (
                                <div key={b.id} className="bg-amber-50 rounded p-1.5 text-xs text-amber-900 border border-amber-200">
                                  <span className="font-bold">{b.professorName}</span> ({b.quantity} un.)
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => onSelectSlot(res.id, period.id)}
                            className="w-full h-full min-h-[60px] border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl p-2 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 transition-all group"
                          >
                            <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Reservar</span>
                            {res.totalQuantity > 1 && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                ({availableQuantity} de {res.totalQuantity} lív.)
                              </span>
                            )}
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
