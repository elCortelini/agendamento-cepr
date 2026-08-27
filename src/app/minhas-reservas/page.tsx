'use client';

import React, { useState, useEffect } from 'react';
import { Booking } from '@/lib/types';
import { useAuth } from '@/components/GoogleAuthProvider';
import {
  CheckSquare,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Download,
  Trash2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const fetchMyBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setBookings(data.bookings || []);
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
      await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          wasUsed: !currentWasUsed,
        }),
      });
      fetchMyBookings();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'DELETE',
      });
      fetchMyBookings();
    } catch (e) {
      console.error('Error cancelling booking:', e);
    }
  };

  const generateICS = (booking: Booking) => {
    const title = `Reserva: ${booking.resourceName} - Turma ${booking.turma}`;
    const description = `Justificativa: ${booking.justification}\\nProfessor: ${booking.professorName}`;
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GECP Seara//Agenda Recursos//PT',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `DTSTART;VALUE=DATE:${booking.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${booking.date.replace(/-/g, '')}`,
      'LOCATION:Grupo Escolar Carlos de Paula Seara',
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Gestão Pessoal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Minhas Reservas de Recursos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe o status das suas reservas e exporte convites para o Google Agenda.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({bookings.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ativas ({bookings.filter((b) => b.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'cancelled' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Canceladas ({bookings.filter((b) => b.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Buscando suas reservas...</p>
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
    </div>
  );
}
