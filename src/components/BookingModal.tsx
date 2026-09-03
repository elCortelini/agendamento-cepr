'use client';

import React, { useState, useEffect } from 'react';
import { Resource, Booking, Block, DEFAULT_PERIODS } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { useAuth } from './GoogleAuthProvider';
import { AlertCircle, Check, Repeat, Sparkles, Edit3 } from 'lucide-react';
import { format, addWeeks } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resources: Resource[];
  blocks?: Block[];
  initialResourceId?: string;
  initialPeriodId?: string;
  initialDate: string;
  bookingToEdit?: Booking | null;
}

export function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  resources,
  blocks = [],
  initialResourceId,
  initialPeriodId,
  initialDate,
  bookingToEdit,
}: BookingModalProps) {
  const { user } = useAuth();

  const [resourceId, setResourceId] = useState(initialResourceId || resources[0]?.id || '');
  const [periodId, setPeriodId] = useState(initialPeriodId || DEFAULT_PERIODS[0]?.id || 'mat-1');
  const [date, setDate] = useState(initialDate);
  const [professorName, setProfessorName] = useState(user?.name || '');
  const [professorEmail, setProfessorEmail] = useState(user?.email || '');
  const [turma, setTurma] = useState('');
  const [justification, setJustification] = useState('');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceUntilDate, setRecurrenceUntilDate] = useState(
    format(addWeeks(new Date(initialDate || new Date()), 4), 'yyyy-MM-dd')
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isResourceBlocked = (resId: string) => {
    if (!blocks || blocks.length === 0) return false;
    const periodObj = DEFAULT_PERIODS.find((p) => p.id === periodId);
    const isMatutino = periodObj?.shift === 'matutino';
    const isVespertino = periodObj?.shift === 'vespertino';

    return blocks.some(
      (b) =>
        b.date === date &&
        (b.resourceId === 'all' || b.resourceId === resId) &&
        (
          b.periodId === 'all_day' ||
          b.periodId === periodId ||
          (b.periodId === 'matutino' && isMatutino) ||
          (b.periodId === 'vespertino' && isVespertino)
        )
    );
  };

  const isResourceAlreadyBooked = (resId: string) => {
    const currentBookings = DataService.getBookings();
    return currentBookings.some(
      (b) =>
        b.status === 'active' &&
        b.date === date &&
        b.periodId === periodId &&
        b.resourceId === resId &&
        (!bookingToEdit || b.id !== bookingToEdit.id)
    );
  };

  // Auto select valid unblocked & unbooked resource or populate from bookingToEdit
  useEffect(() => {
    if (bookingToEdit) {
      setResourceId(bookingToEdit.resourceId);
      setPeriodId(bookingToEdit.periodId);
      setDate(bookingToEdit.date);
      setProfessorName(bookingToEdit.professorName);
      setProfessorEmail(bookingToEdit.professorEmail);
      setTurma(bookingToEdit.turma || '');
      setJustification(bookingToEdit.justification || '');
    } else {
      if (initialResourceId && !isResourceBlocked(initialResourceId) && !isResourceAlreadyBooked(initialResourceId)) {
        setResourceId(initialResourceId);
      } else {
        const firstAvailable = resources.find(
          (r) => !isResourceBlocked(r.id) && !isResourceAlreadyBooked(r.id)
        );
        if (firstAvailable) setResourceId(firstAvailable.id);
      }
      if (initialPeriodId) setPeriodId(initialPeriodId);
      if (initialDate) setDate(initialDate);
      if (user) {
        setProfessorName(user.name);
        setProfessorEmail(user.email);
      }
    }
  }, [bookingToEdit, initialResourceId, initialPeriodId, initialDate, resources, isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetResourceId = resourceId || (resources.find((r) => !isResourceBlocked(r.id) && !isResourceAlreadyBooked(r.id))?.id || '');
    const finalEmail =
      professorEmail ||
      user?.email ||
      (professorName ? `${professorName.toLowerCase().trim().replace(/[^a-z0-9]/g, '.')}@pedrorizzi.edu.br` : 'professor@pedrorizzi.edu.br');

    if (!targetResourceId || !periodId || !date || !professorName || !turma) {
      setError('Por favor, preencha todos os campos obrigatórios (Recurso, Data, Horário, Nome e Turma).');
      return;
    }

    if (isResourceBlocked(targetResourceId)) {
      setError('Este recurso está bloqueado administrativamente para a data e horário selecionados.');
      return;
    }

    // Validation: Check if the exact same resource is already booked for this period
    const currentBookings = DataService.getBookings();
    const conflictBooking = currentBookings.find(
      (b) =>
        b.status === 'active' &&
        b.date === date &&
        b.periodId === periodId &&
        b.resourceId === targetResourceId &&
        (!bookingToEdit || b.id !== bookingToEdit.id)
    );

    if (conflictBooking) {
      setError(
        `O recurso "${conflictBooking.resourceName}" JÁ ESTÁ RESERVADO para este mesmo horário pelo Prof. ${conflictBooking.professorName} (${conflictBooking.turma || 'Outra Turma'}). Por favor, escolha outro recurso ou horário.`
      );
      return;
    }

    // Validation for recurring bookings
    if (isRecurring && recurrenceUntilDate) {
      let nextDate = addWeeks(new Date(date + 'T12:00:00'), 1);
      const endDate = new Date(recurrenceUntilDate + 'T23:59:59');

      while (nextDate <= endDate) {
        const dStr = format(nextDate, 'yyyy-MM-dd');
        const futureConflict = currentBookings.find(
          (b) =>
            b.status === 'active' &&
            b.date === dStr &&
            b.periodId === periodId &&
            b.resourceId === targetResourceId
        );

        if (futureConflict) {
          setError(
            `Conflito na reserva recorrente: O recurso já está reservado no dia ${format(nextDate, 'dd/MM/yyyy')} pelo Prof. ${futureConflict.professorName} (${futureConflict.turma}).`
          );
          return;
        }

        nextDate = addWeeks(nextDate, 1);
      }
    }

    const selectedResource = resources.find((r) => r.id === targetResourceId);
    const selectedPeriod = DEFAULT_PERIODS.find((p) => p.id === periodId);

    setLoading(true);

    try {
      if (bookingToEdit) {
        DataService.deleteBooking(bookingToEdit.id);
        DataService.saveBooking({
          id: bookingToEdit.id,
          resourceId: targetResourceId,
          resourceName: selectedResource ? selectedResource.name : 'Recurso Escolar',
          date,
          periodId,
          periodName: selectedPeriod ? selectedPeriod.name : periodId,
          quantity: 1,
          professorName,
          professorEmail: finalEmail,
          turma,
          justification,
        });
      } else {
        DataService.saveBooking({
          resourceId: targetResourceId,
          resourceName: selectedResource ? selectedResource.name : 'Recurso Escolar',
          date,
          periodId,
          periodName: selectedPeriod ? selectedPeriod.name : periodId,
          quantity: 1,
          professorName,
          professorEmail: finalEmail,
          turma,
          justification,
        });

        // Save recurring bookings if checked
        if (isRecurring && recurrenceUntilDate) {
          let nextDate = addWeeks(new Date(date + 'T12:00:00'), 1);
          const endDate = new Date(recurrenceUntilDate + 'T23:59:59');

          while (nextDate <= endDate) {
            const dStr = format(nextDate, 'yyyy-MM-dd');
            DataService.saveBooking({
              resourceId: targetResourceId,
              resourceName: selectedResource ? selectedResource.name : 'Recurso Escolar',
              date: dStr,
              periodId,
              periodName: selectedPeriod ? selectedPeriod.name : periodId,
              quantity: 1,
              professorName,
              professorEmail: finalEmail,
              turma,
              justification,
            });
            nextDate = addWeeks(nextDate, 1);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar reserva.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner shrink-0">
            {bookingToEdit ? <Edit3 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {bookingToEdit ? 'Editar Reserva de Recurso' : 'Nova Reserva de Recurso'}
            </h2>
            <p className="text-xs text-gray-500">
              Centro Educacional Pedro Rizzi
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Recurso Escolar *
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            >
              {resources.length === 0 ? (
                <option value="">Carregando recursos...</option>
              ) : (
                resources.map((res) => {
                  const blocked = isResourceBlocked(res.id);
                  const alreadyBooked = isResourceAlreadyBooked(res.id);
                  const disabled = blocked || alreadyBooked;
                  let statusText = '';
                  if (blocked) statusText = ' 🔒 (Bloqueado neste horário)';
                  else if (alreadyBooked) statusText = ' ❌ (Já reservado por outro professor)';

                  return (
                    <option key={res.id} value={res.id} disabled={disabled}>
                      {res.name} {statusText}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Date & Period Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Data da Reserva *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Horário / Período *
              </label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              >
                {DEFAULT_PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Professor & Turma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nome do Professor *
              </label>
              <input
                type="text"
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                placeholder="Ex: Prof. Maria Silva"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
              {user?.role === 'admin' && (
                <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                  (Como admin, você pode agendar para outros professores)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Turma / Ano *
              </label>
              <input
                type="text"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                placeholder="Ex: 5º Ano A"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* Justificativa Pedagógica */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Observação / Justificativa Pedagógica
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva a justificativa pedagógica para uso do recurso..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none"
            />
          </div>

          {/* Recurrence Options (only for new bookings) */}
          {!bookingToEdit && (
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  Criar Reserva Recorrente (Semanalmente)
                </span>
              </label>

              {isRecurring && (
                <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Repetir toda semana até a data:
                  </label>
                  <input
                    type="date"
                    value={recurrenceUntilDate}
                    min={date}
                    onChange={(e) => setRecurrenceUntilDate(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-bold text-indigo-950 outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{bookingToEdit ? 'Salvar Alterações' : 'Confirmar Reserva'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
