'use client';

import React, { useState, useEffect } from 'react';
import { Booking, Resource, DEFAULT_PERIODS } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { useAuth } from '@/components/GoogleAuthProvider';
import { BookingModal } from '@/components/BookingModal';
import {
  CheckSquare,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Download,
  Trash2,
  CalendarDays,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Monitor,
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFormat, setViewFormat] = useState<'grid' | 'cards'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));
  const weekRangeText = `${format(weekDays[0], 'dd/MM')} - ${format(weekDays[4], 'dd/MM')}`;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const morningPeriods = DEFAULT_PERIODS.filter((p) => p.shift === 'matutino');
  const afternoonPeriods = DEFAULT_PERIODS.filter((p) => p.shift === 'vespertino');

  const fetchMyBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await DataService.syncCloudData();
      setResources(DataService.getResources());
      const allBookings = DataService.getBookings();

      const userEmail = (user.email || '').trim().toLowerCase();
      const userName = (user.name || '').trim().toLowerCase();

      const myBookings = allBookings.filter((b) => {
        const bEmail = (b.professorEmail || '').trim().toLowerCase();
        const bName = (b.professorName || '').trim().toLowerCase();

        return (userEmail && bEmail === userEmail) || (userName && bName === userName);
      });

      setBookings(myBookings);
    } catch (e) {
      console.error('Error fetching bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  const handleToggleUsed = async (bookingId: string, currentWasUsed?: boolean) => {
    try {
      const b = bookings.find((item) => item.id === bookingId);
      if (b) {
        await DataService.saveBooking({
          ...b,
          wasUsed: !currentWasUsed,
          status: !currentWasUsed ? 'completed' : 'active',
        });
        await fetchMyBookings();
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      await DataService.deleteBooking(bookingId);
      await fetchMyBookings();
    } catch (e) {
      console.error('Error cancelling booking:', e);
    }
  };

  const handleEdit = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
  };

  const generateICS = (booking: Booking) => {
    const title = `Reserva: ${booking.resourceName} - Turma ${booking.turma}`;
    const description = `Justificativa: ${booking.justification}\\nProfessor: ${booking.professorName}`;
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CEPR//Agenda Recursos//PT',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `DTSTART;VALUE=DATE:${booking.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${booking.date.replace(/-/g, '')}`,
      'LOCATION:Centro Educacional Pedro Rizzi',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reserva-${booking.date}-${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const renderSlotCell = (dayDate: Date, periodId: string) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    const slotBookings = filteredBookings.filter(
      (b) => b.date === dateStr && b.periodId === periodId
    );

    if (slotBookings.length === 0) {
      return (
        <div className="h-full min-h-[50px] flex items-center justify-center text-[10px] text-slate-300 font-medium italic">
          —
        </div>
      );
    }

    return (
      <div className="space-y-1 p-0.5">
        {slotBookings.map((b) => (
          <div
            key={b.id}
            className={`border rounded-lg p-1.5 shadow-xs transition-all ${
              b.status === 'cancelled'
                ? 'bg-rose-50 border-rose-200 text-rose-800 opacity-60'
                : b.wasUsed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1 truncate min-w-0">
                <Monitor className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="font-extrabold text-[11px] truncate block leading-tight">
                  {b.resourceName.split('(')[0]}
                </span>
              </div>
              {b.turma && (
                <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded shrink-0">
                  {b.turma}
                </span>
              )}
            </div>

            {b.justification && (
              <p className="text-[9px] text-slate-600 truncate mt-0.5 italic">
                "{b.justification}"
              </p>
            )}

            <div className="flex items-center justify-between mt-1 pt-1 border-t border-indigo-100/60 text-[9px]">
              <span
                className={`font-black uppercase px-1 py-0.2 rounded text-[8px] ${
                  b.status === 'cancelled'
                    ? 'bg-rose-200 text-rose-800'
                    : b.wasUsed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {b.status === 'cancelled' ? 'Cancelada' : b.wasUsed ? 'Utilizada' : 'Pendente'}
              </span>

              <div className="flex items-center gap-1">
                {b.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleToggleUsed(b.id, b.wasUsed)}
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-700"
                      title={b.wasUsed ? 'Desmarcar uso' : 'Confirmar uso'}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1 hover:bg-indigo-100 rounded text-indigo-700"
                      title="Editar reserva"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="p-1 hover:bg-rose-100 rounded text-rose-600"
                      title="Cancelar reserva"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Gestão Pessoal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Minhas Reservas de Recursos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize seus horários reservados no formato de grade semanal ou em cartões individuais.
          </p>
        </div>

        {/* View Switcher & Week Navigator */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Grade Semanal / Lista de Cartões */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewFormat('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewFormat === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Grade Semanal</span>
            </button>

            <button
              onClick={() => setViewFormat('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewFormat === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lista de Cartões</span>
            </button>
          </div>

          {viewFormat === 'grid' && (
            <>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Hoje
              </button>

              <div className="flex items-center bg-indigo-600 text-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                  className="p-1.5 hover:bg-indigo-700 transition-colors border-r border-indigo-500/50"
                  title="Semana Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2.5 py-1.5 text-xs font-bold font-mono">
                  {weekRangeText}
                </span>

                <button
                  onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                  className="p-1.5 hover:bg-indigo-700 transition-colors border-l border-indigo-500/50"
                  title="Próxima Semana"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({bookings.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativas ({bookings.filter((b) => b.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'cancelled' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Canceladas ({bookings.filter((b) => b.status === 'cancelled').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Sincronizando suas reservas com a nuvem...</p>
        </div>
      ) : viewFormat === 'grid' ? (
        /* GRADE SEMANAL DAS MINHAS RESERVAS */
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
                          {renderSlotCell(day, period.id)}
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
                          {renderSlotCell(day, period.id)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Nenhuma reserva encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Você ainda não possui reservas cadastradas ou nenhuma corresponde ao filtro selecionado.
          </p>
        </div>
      ) : (
        /* VISÃO EM CARTÕES */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                b.status === 'cancelled' ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-indigo-100'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {b.resourceName}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      b.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : b.wasUsed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status === 'cancelled'
                      ? 'Cancelada'
                      : b.wasUsed
                      ? 'Utilizada'
                      : 'Pendente'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>
                      {format(parseISO(b.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{b.periodName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>
                      Turma: <strong>{b.turma}</strong> ({b.quantity} un./vaga)
                    </span>
                  </div>

                  {b.justification && (
                    <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{b.justification}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                {b.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleToggleUsed(b.id, b.wasUsed)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                        b.wasUsed
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{b.wasUsed ? 'Marcar não usado' : 'Confirmar Uso'}</span>
                    </button>

                    <button
                      onClick={() => generateICS(b)}
                      className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                      title="Baixar evento para Google Agenda"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Google Agenda (.ICS)</span>
                    </button>

                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Booking Modal */}
      {isEditModalOpen && (
        <BookingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setBookingToEdit(null);
          }}
          onSuccess={fetchMyBookings}
          resources={resources}
          bookingToEdit={bookingToEdit}
          initialDate={bookingToEdit?.date || todayStr}
        />
      )}
    </div>
  );
}
