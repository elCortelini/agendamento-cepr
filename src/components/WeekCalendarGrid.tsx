'use client';

import React from 'react';
import { Resource, Booking, Block, DEFAULT_PERIODS } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { useAuth } from './GoogleAuthProvider';
import { Lock, Plus, Monitor, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekCalendarGridProps {
  weekDays: Date[];
  bookings: Booking[];
  blocks: Block[];
  resources: Resource[];
  onSelectSlot: (dateStr: string, periodId: string) => void;
  onRefresh: () => void;
}

export function WeekCalendarGrid({
  weekDays,
  bookings,
  blocks,
  resources,
  onSelectSlot,
  onRefresh,
}: WeekCalendarGridProps) {
  const { user } = useAuth();
  const morningPeriods = DEFAULT_PERIODS.filter((p) => p.shift === 'matutino');
  const afternoonPeriods = DEFAULT_PERIODS.filter((p) => p.shift === 'vespertino');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleDeleteBooking = (bookingId: string, professorName: string) => {
    const isSelf = user?.role === 'admin' ? 'como Administrador' : 'sua própria reserva';
    if (!confirm(`Confirmar exclusão da reserva de ${professorName} (${isSelf})?`)) return;

    try {
      DataService.deleteBooking(bookingId);
      onRefresh();
    } catch (e) {
      alert('Erro ao excluir a reserva.');
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    if (user?.role !== 'admin') return;
    if (!confirm('Confirmar remoção deste bloqueio administrativo?')) return;

    try {
      DataService.deleteBlock(blockId);
      onRefresh();
    } catch (e) {
      alert('Erro ao remover o bloqueio.');
    }
  };

  const renderSlotContent = (dayDate: Date, periodId: string) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    const slotBlock = blocks.find(
      (b) =>
        b.date === dateStr &&
        (b.periodId === 'all_day' || b.periodId === periodId)
    );

    const slotBookings = bookings.filter(
      (b) => b.date === dateStr && b.periodId === periodId && b.status === 'active'
    );

    return (
      <div className="space-y-1.5 min-h-[90px] flex flex-col justify-between p-2">
        {slotBlock ? (
          <div className="bg-slate-200/90 border border-slate-300 rounded-xl p-2.5 flex items-center justify-between text-slate-700 shadow-sm group">
            <div className="flex items-center space-x-2 truncate">
              <span className="p-1 bg-slate-300 rounded-md shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </span>
              <span className="text-xs font-bold truncate">{slotBlock.reason || 'Pré-Conselho'}</span>
            </div>
            {user?.role === 'admin' ? (
              <button
                onClick={() => handleDeleteBlock(slotBlock.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                title="Remover Bloqueio (Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            )}
          </div>
        ) : slotBookings.length > 0 ? (
          <div className="space-y-1">
            {slotBookings.map((b) => {
              const isAdmin = user?.role === 'admin';
              const isMine = user?.email && b.professorEmail.toLowerCase() === user.email.toLowerCase();
              const canDelete = isAdmin || isMine;

              return (
                <div
                  key={b.id}
                  className={`bg-white border rounded-xl p-2.5 shadow-sm text-slate-800 flex items-center justify-between transition-all ${
                    isMine ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="p-1 bg-indigo-50 rounded-md shrink-0">
                      <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate">{b.professorName}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {b.resourceName.split('(')[0]} {b.turma ? `• ${b.turma}` : ''}
                      </span>
                    </div>
                  </div>

                  {canDelete ? (
                    <button
                      onClick={() => handleDeleteBooking(b.id, b.professorName)}
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors shrink-0"
                      title={isAdmin ? 'Excluir horário (Admin)' : 'Cancelar minha reserva'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span title="Reservado por outro professor (Apenas o próprio professor ou admin pode cancelar)">
                      <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-1" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {!slotBlock && (
          <button
            onClick={() => onSelectSlot(dateStr, periodId)}
            className="w-full border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl py-1.5 text-slate-400 hover:text-indigo-600 font-semibold text-xs transition-all flex items-center justify-center gap-1 group mt-1"
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Nova</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-indigo-600 text-white text-xs uppercase font-extrabold tracking-wider">
              <th className="p-3.5 text-left w-36 bg-indigo-700">Período</th>
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = dateStr === todayStr;
                return (
                  <th
                    key={dateStr}
                    className={`p-3.5 text-center border-l border-indigo-500/40 ${
                      isToday ? 'bg-indigo-500 text-white font-black' : 'bg-indigo-600'
                    }`}
                  >
                    <div className="capitalize">{format(day, 'EEEE', { locale: ptBR })}</div>
                    <div className="text-[11px] font-normal opacity-90 mt-0.5">
                      {format(day, 'dd/MM')} {isToday ? '(Hoje)' : ''}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            <tr className="bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest">
              <td colSpan={6} className="px-4 py-2 bg-indigo-700 border-t border-indigo-500">
                MANHÃ
              </td>
            </tr>

            {morningPeriods.map((period) => (
              <tr key={period.id} className="border-t border-slate-200">
                <td className="p-3 bg-slate-50 font-bold text-xs text-slate-700 middle border-r border-slate-200">
                  <div className="text-indigo-700 font-extrabold text-sm">{period.number}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;

                  return (
                    <td
                      key={dateStr}
                      className={`p-1.5 border-l border-slate-200 align-top ${
                        isToday ? 'bg-indigo-50/20' : 'bg-white'
                      }`}
                    >
                      {renderSlotContent(day, period.id)}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest border-t-2 border-indigo-700">
              <td colSpan={6} className="px-4 py-2 bg-indigo-700">
                TARDE
              </td>
            </tr>

            {afternoonPeriods.map((period) => (
              <tr key={period.id} className="border-t border-slate-200">
                <td className="p-3 bg-slate-50 font-bold text-xs text-slate-700 middle border-r border-slate-200">
                  <div className="text-indigo-700 font-extrabold text-sm">{period.number}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;

                  return (
                    <td
                      key={dateStr}
                      className={`p-1.5 border-l border-slate-200 align-top ${
                        isToday ? 'bg-indigo-50/20' : 'bg-white'
                      }`}
                    >
                      {renderSlotContent(day, period.id)}
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
