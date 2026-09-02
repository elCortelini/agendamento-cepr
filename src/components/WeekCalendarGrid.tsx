'use client';

import React from 'react';
import { Resource, Booking, Block, DEFAULT_PERIODS } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { useAuth } from './GoogleAuthProvider';
import { Lock, Plus, Monitor, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekCalendarGridProps {
  weekDays: Date[];
  bookings: Booking[];
  blocks: Block[];
  resources: Resource[];
  onSelectSlot: (dateStr: string, periodId: string) => void;
  onEditBooking?: (booking: Booking) => void;
  onRefresh: () => void;
}

export function WeekCalendarGrid({
  weekDays,
  bookings,
  blocks,
  resources,
  onSelectSlot,
  onEditBooking,
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
    const periodObj = DEFAULT_PERIODS.find((p) => p.id === periodId);
    const isMatutino = periodObj?.shift === 'matutino';
    const isVespertino = periodObj?.shift === 'vespertino';

    // Block for ALL resources in the school
    const allResourcesBlock = blocks.find(
      (b) =>
        b.date === dateStr &&
        b.resourceId === 'all' &&
        (
          b.periodId === 'all_day' ||
          b.periodId === periodId ||
          (b.periodId === 'matutino' && isMatutino) ||
          (b.periodId === 'vespertino' && isVespertino)
        )
    );

    // Blocks for SPECIFIC resources
    const specificResourceBlocks = blocks.filter(
      (b) =>
        b.date === dateStr &&
        b.resourceId !== 'all' &&
        (
          b.periodId === 'all_day' ||
          b.periodId === periodId ||
          (b.periodId === 'matutino' && isMatutino) ||
          (b.periodId === 'vespertino' && isVespertino)
        )
    );

    const slotBookings = bookings.filter(
      (b) => b.date === dateStr && b.periodId === periodId && b.status === 'active'
    );

    return (
      <div className="space-y-1 min-h-[44px] flex flex-col justify-center p-0.5">
        {allResourcesBlock ? (
          <div className="bg-slate-200/90 border border-slate-300 rounded-lg p-1.5 flex items-center justify-between text-slate-700 shadow-sm group">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="p-0.5 bg-slate-300 rounded shrink-0">
                <Lock className="w-3 h-3 text-slate-600" />
              </span>
              <span className="text-[11px] font-bold truncate">{allResourcesBlock.reason || 'Bloqueado (Todos os Recursos)'}</span>
            </div>
            {user?.role === 'admin' ? (
              <button
                onClick={() => handleDeleteBlock(allResourcesBlock.id)}
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                title="Remover Bloqueio Geral (Admin)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            ) : (
              <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
            )}
          </div>
        ) : (
          <>
            {/* Specific Resource Blocks */}
            {specificResourceBlocks.length > 0 && (
              <div className="space-y-1">
                {specificResourceBlocks.map((sb) => {
                  const resName = resources.find((r) => r.id === sb.resourceId)?.name.split('(')[0] || sb.resourceName || 'Recurso';
                  return (
                    <div
                      key={sb.id}
                      className="bg-amber-100/80 border border-amber-300 rounded-lg p-1.5 flex items-center justify-between text-amber-900 shadow-2xs group"
                    >
                      <div className="flex items-center space-x-1.5 truncate leading-tight">
                        <span className="p-0.5 bg-amber-200 rounded shrink-0">
                          <Lock className="w-3 h-3 text-amber-700" />
                        </span>
                        <div className="truncate">
                          <span className="text-[10px] font-black block truncate text-amber-950">{resName}</span>
                          <span className="text-[9px] font-medium block truncate text-amber-800">{sb.reason || 'Bloqueado'}</span>
                        </div>
                      </div>
                      {user?.role === 'admin' ? (
                        <button
                          onClick={() => handleDeleteBlock(sb.id)}
                          className="text-amber-600 hover:text-rose-600 p-0.5 rounded transition-colors shrink-0"
                          title="Remover Bloqueio de Recurso (Admin)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      ) : (
                        <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Bookings */}
            {slotBookings.length > 0 && (
              <div className="space-y-1">
                {slotBookings.map((b) => {
                  const isAdmin = user?.role === 'admin';
                  const isMine = user?.email && b.professorEmail.toLowerCase() === user.email.toLowerCase();
                  const canModify = isAdmin || isMine;

                  return (
                    <div
                      key={b.id}
                      className={`bg-white border rounded-lg p-1.5 shadow-sm text-slate-800 flex items-center justify-between transition-all ${
                        isMine ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/40' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate min-w-0 pr-1">
                        <span className="p-1 bg-indigo-50 rounded shrink-0">
                          <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                        </span>
                        <div className="truncate leading-tight">
                          <span className="text-[11px] font-extrabold text-slate-900 block truncate">{b.professorName}</span>
                          <span className="text-[9px] text-slate-500 font-medium block truncate">
                            {b.resourceName.split('(')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-1">
                        {b.turma && (
                          <span className="font-black text-xs text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-300/80 shadow-2xs tracking-wide">
                            {b.turma}
                          </span>
                        )}

                        {canModify && onEditBooking && (
                          <button
                            onClick={() => onEditBooking(b)}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-0.5 rounded transition-colors shrink-0"
                            title={isAdmin ? 'Editar reserva (Admin)' : 'Editar minha reserva'}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}

                        {canModify ? (
                          <button
                            onClick={() => handleDeleteBooking(b.id, b.professorName)}
                            className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded transition-colors shrink-0"
                            title={isAdmin ? 'Excluir horário (Admin)' : 'Cancelar minha reserva'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span title="Reservado por outro professor">
                            <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nova Reserva Button (Available if at least 1 resource is unblocked) */}
            <button
              onClick={() => onSelectSlot(dateStr, periodId)}
              className="w-full border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-lg py-1 text-slate-400 hover:text-indigo-600 font-semibold text-[11px] transition-all flex items-center justify-center gap-1 group mt-1"
            >
              <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span>Nova</span>
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[950px]">
          <thead>
            <tr className="bg-indigo-600 text-white text-xs uppercase font-extrabold tracking-wider">
              <th className="p-2 text-center w-[85px] bg-indigo-700">Período</th>
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = dateStr === todayStr;
                return (
                  <th
                    key={dateStr}
                    className={`p-2 text-center border-l transition-all ${
                      isToday
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-indigo-600 text-white border-indigo-500/40'
                    }`}
                  >
                    <div className="capitalize font-black text-xs">{format(day, 'EEEE', { locale: ptBR })}</div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 flex items-center justify-center gap-1">
                      <span>{format(day, 'dd/MM')}</span>
                      {isToday && (
                        <span className="bg-slate-950 text-amber-300 font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-wider ml-1">
                          HOJE
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            <tr className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest">
              <td colSpan={6} className="px-3 py-1 bg-indigo-700 border-t border-indigo-500">
                MANHÃ
              </td>
            </tr>

            {morningPeriods.map((period) => (
              <tr key={period.id} className="border-t border-slate-200">
                <td className="p-1 bg-slate-50 font-bold text-xs text-slate-700 text-center border-r border-slate-200">
                  <div className="text-indigo-700 font-black text-xs leading-tight">{period.number}</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;

                  return (
                    <td
                      key={dateStr}
                      className={`p-1 border-l border-slate-200 align-top ${
                        isToday ? 'bg-amber-50/70 border-amber-300/60' : 'bg-white'
                      }`}
                    >
                      {renderSlotContent(day, period.id)}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest border-t-2 border-indigo-700">
              <td colSpan={6} className="px-4 py-1 bg-indigo-700">
                TARDE
              </td>
            </tr>

            {afternoonPeriods.map((period) => (
              <tr key={period.id} className="border-t border-slate-200">
                <td className="p-1 bg-slate-50 font-bold text-xs text-slate-700 text-center border-r border-slate-200">
                  <div className="text-indigo-700 font-black text-xs leading-tight">{period.number}</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = dateStr === todayStr;

                  return (
                    <td
                      key={dateStr}
                      className={`p-1 border-l border-slate-200 align-top ${
                        isToday ? 'bg-amber-50/70 border-amber-300/60' : 'bg-white'
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
